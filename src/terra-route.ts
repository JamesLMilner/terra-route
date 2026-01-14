import { FeatureCollection, LineString, Point, Feature, Position } from "geojson"; // Import GeoJSON types
import { haversineDistance } from "./distance/haversine"; // Great-circle distance function (default heuristic/edge weight)
import { createCheapRuler } from "./distance/cheap-ruler"; // Factory for faster planar distance (exported for consumers)
import { HeapConstructor } from "./heap/heap"; // Heap interface so users can plug custom heaps
import { FourAryHeap } from "./heap/four-ary-heap";

interface Router {
    buildRouteGraph(network: FeatureCollection<LineString>): void;
    expandRouteGraph(network: FeatureCollection<LineString>): void;
    getRoute(start: Feature<Point>, end: Feature<Point>): Feature<LineString> | null;
}

class TerraRoute implements Router {
    private network: FeatureCollection<LineString> | null = null; // The last network used to build the graph
    private distanceMeasurement: (a: Position, b: Position) => number; // Distance function used for edges and heuristic
    private heapConstructor: HeapConstructor; // Heap class used by A*

    // Map from longitude → (map from latitude → index) to deduplicate coordinates and get node indices quickly
    private coordinateIndexMap: Map<number, Map<number, number>> = new Map(); // Nested map for exact coord lookup
    private coordinates: Position[] = []; // Array of all unique coordinates by index
    // Sparse adjacency list used during build and for any nodes added dynamically later
    private adjacencyList: Array<Array<{ node: number, distance: number }>> = []; // Per-node neighbor arrays used only pre-CSR or for dynamic nodes

    // Compressed Sparse Row adjacency representation for fast neighbor iteration in getRoute
    private csrOffsets: Int32Array | null = null;      // Row pointer: length = nodeCount + 1, offsets into indices/distances
    private csrIndices: Int32Array | null = null;      // Column indices: neighbor node IDs, length = totalEdges
    private csrDistances: Float64Array | null = null;  // Edge weights aligned to csrIndices, length = totalEdges
    private csrNodeCount = 0; // Number of nodes captured in the CSR arrays

    // Reusable typed scratch buffers for shortest-path search
    private gScoreScratch: Float64Array | null = null; // gScore per node (cost from start)
    private cameFromScratch: Int32Array | null = null; // Predecessor per node for path reconstruction
    private visitedScratch: Uint8Array | null = null; // Visited set to avoid reprocessing
    // Reverse-direction scratch for bidirectional search
    private gScoreRevScratch: Float64Array | null = null; // gScore per node from the end
    private cameFromRevScratch: Int32Array | null = null; // Successor per node (next step toward the end)
    private visitedRevScratch: Uint8Array | null = null; // Visited set for reverse search
    private scratchCapacity = 0; // Current capacity of scratch arrays

    // Reused open sets to avoid heap allocations during repeated getRoute calls.
    // (If a custom heap doesn't implement `clear()`, we fall back to constructing anew.)
    private openForward: InstanceType<HeapConstructor> | null = null;
    private openReverse: InstanceType<HeapConstructor> | null = null;

    constructor(options?: {
        distanceMeasurement?: (a: Position, b: Position) => number; // Optional distance function override
        heap?: HeapConstructor; // Optional heap implementation override
    }) {
        this.distanceMeasurement = options?.distanceMeasurement ?? haversineDistance; // Default to haversine
        this.heapConstructor = options?.heap ?? FourAryHeap; // Default to MinHeap
    }

    /**
     * Builds a graph (CSR) from a LineString FeatureCollection.
     * Two-pass build: pass 1 assigns node indices and counts degrees; pass 2 fills CSR arrays.
     */
    public buildRouteGraph(network: FeatureCollection<LineString>): void {
        this.network = network; // Keep a reference to the network

        // Reset internal structures for a fresh build
        this.coordinateIndexMap = new Map(); // Clear coordinate index map
        this.coordinates = []; // Clear coordinates array
        this.adjacencyList = []; // Will not be populated during build; reserved for dynamic nodes post-build
        // Reset CSR structures (will rebuild below)
        this.csrOffsets = null;
        this.csrIndices = null;
        this.csrDistances = null;
        this.csrNodeCount = 0;

        // Hoist to locals for speed (avoid repeated property lookups in hot loops)
        const coordIndexMapLocal = this.coordinateIndexMap; // Local alias for coord map
        const coordsLocal = this.coordinates; // Local alias for coordinates array
        const measureDistance = this.distanceMeasurement; // Local alias for distance function

        // Pass 1: assign indices and count degrees per node
        const degree: number[] = []; // Dynamic degree array; grows as nodes are discovered
        this.forEachSegment(network, (a, b) => {
            const indexA = this.indexCoordinate(a, coordIndexMapLocal, coordsLocal);
            const indexB = this.indexCoordinate(b, coordIndexMapLocal, coordsLocal);

            degree[indexA] = (degree[indexA] ?? 0) + 1;
            degree[indexB] = (degree[indexB] ?? 0) + 1;
        });

        // Build CSR arrays from degree counts
        const nodeCount = this.coordinates.length; // Total nodes discovered
        this.csrNodeCount = nodeCount; // CSR covers all built nodes
        const offsets = new Int32Array(nodeCount + 1); // Row pointer array
        for (let i = 0; i < nodeCount; i++) {
            const deg = degree[i] ?? 0; // Degree of node i
            offsets[i + 1] = offsets[i] + deg; // Prefix sum
        }
        const totalEdges = offsets[nodeCount]; // Total adjacency entries
        const indices = new Int32Array(totalEdges); // Neighbor indices array
        const distances = new Float64Array(totalEdges); // Distances array aligned to indices

        // Pass 2: fill CSR arrays using a write cursor per node
        const cursor = offsets.slice(); // Current write positions per node
        this.forEachSegment(network, (a, b) => {
            // Read back indices (guaranteed to exist from pass 1)
            const indexA = this.coordinateIndexMap.get(a[0])!.get(a[1])!;
            const indexB = this.coordinateIndexMap.get(b[0])!.get(b[1])!;

            const segmentDistance = measureDistance(a, b); // Edge weight once

            let pos = cursor[indexA]++;
            indices[pos] = indexB;
            distances[pos] = segmentDistance;
            pos = cursor[indexB]++;
            indices[pos] = indexA;
            distances[pos] = segmentDistance;
        });

        // Commit CSR to instance
        this.csrOffsets = offsets;
        this.csrIndices = indices;
        this.csrDistances = distances;

        // Prepare sparse shell only for dynamically added nodes later (no prefilled neighbor arrays)
        this.adjacencyList = new Array(nodeCount);
    }

    /**
     * Expands (merges) the existing graph with an additional LineString FeatureCollection.
     */
    public expandRouteGraph(network: FeatureCollection<LineString>): void {
        if (this.network === null) {
            throw new Error("Network not built. Please call buildRouteGraph(network) first.");
        }

        // Merge the feature arrays for reference/debugging. We avoid copying properties deeply.
        this.network = {
            type: "FeatureCollection",
            features: [...this.network.features, ...network.features],
        };

        const coordIndexMapLocal = this.coordinateIndexMap;
        const coordsLocal = this.coordinates;
        const measureDistance = this.distanceMeasurement;
        const adj = this.adjacencyList;

        // Ensure we have adjacency arrays for any existing CSR-only nodes.
        // (During buildRouteGraph, adjacencyList is sized but entries are undefined.)
        for (let i = 0; i < adj.length; i++) {
            if (adj[i] === undefined) adj[i] = [];
        }

        // Add new edges into the adjacency list (sparse), then rebuild CSR from adjacency.
        this.forEachSegment(network, (a, b) => {
            const indexA = this.indexCoordinate(a, coordIndexMapLocal, coordsLocal, (idx) => { adj[idx] = []; });
            const indexB = this.indexCoordinate(b, coordIndexMapLocal, coordsLocal, (idx) => { adj[idx] = []; });

            const segmentDistance = measureDistance(a, b);

            adj[indexA].push({ node: indexB, distance: segmentDistance });
            adj[indexB].push({ node: indexA, distance: segmentDistance });
        });

        this.rebuildCsrFromAdjacency();
    }

    /**
     * Rebuild CSR arrays for the full node set, using:
     * - Existing CSR edges (from the last build/expand)
     * - Any additional edges stored in `adjacencyList`
     */
    private rebuildCsrFromAdjacency(): void {
        const nodeCount = this.coordinates.length;
        const adj = this.adjacencyList;

        // Compute degree using CSR degree + adjacency degree
        const degree = new Int32Array(nodeCount);

        if (this.csrOffsets && this.csrIndices && this.csrDistances) {
            const csrOffsets = this.csrOffsets;
            const covered = Math.min(this.csrNodeCount, nodeCount);
            for (let i = 0; i < covered; i++) {
                degree[i] += (csrOffsets[i + 1] - csrOffsets[i]);
            }
        }

        for (let i = 0; i < nodeCount; i++) {
            const neighbors = adj[i];
            if (neighbors && neighbors.length) degree[i] += neighbors.length;
        }

        const offsets = new Int32Array(nodeCount + 1);
        for (let i = 0; i < nodeCount; i++) {
            offsets[i + 1] = offsets[i] + degree[i];
        }
        const totalEdges = offsets[nodeCount];
        const indices = new Int32Array(totalEdges);
        const distances = new Float64Array(totalEdges);
        const cursor = offsets.slice();

        // Copy existing CSR edges first
        if (this.csrOffsets && this.csrIndices && this.csrDistances) {
            const csrOffsets = this.csrOffsets;
            const csrIndices = this.csrIndices;
            const csrDistances = this.csrDistances;
            const covered = Math.min(this.csrNodeCount, nodeCount);
            for (let n = 0; n < covered; n++) {
                const startOff = csrOffsets[n];
                const endOff = csrOffsets[n + 1];
                let pos = cursor[n];
                for (let i = startOff; i < endOff; i++) {
                    indices[pos] = csrIndices[i];
                    distances[pos] = csrDistances[i];
                    pos++;
                }
                cursor[n] = pos;
            }
        }

        // Append adjacency edges
        for (let n = 0; n < nodeCount; n++) {
            const neighbors = adj[n];
            if (!neighbors || neighbors.length === 0) continue;
            let pos = cursor[n];
            for (let i = 0, len = neighbors.length; i < len; i++) {
                const nb = neighbors[i];
                indices[pos] = nb.node;
                distances[pos] = nb.distance;
                pos++;
            }
            cursor[n] = pos;
        }

        // Commit and reset adjacency (we've absorbed edges into CSR)
        this.csrOffsets = offsets;
        this.csrIndices = indices;
        this.csrDistances = distances;
        this.csrNodeCount = nodeCount;

        // Keep adjacency list for *future* dynamic additions, but clear existing edges to avoid duplication.
        this.adjacencyList = new Array(nodeCount);
    }

    /**
      * Computes the shortest route between two points in the network using the A* algorithm.
      * 
      * @param start - A GeoJSON Point Feature representing the start location.
      * @param end - A GeoJSON Point Feature representing the end location.
      * @returns A GeoJSON LineString Feature representing the shortest path, or null if no path is found.
      * 
      * @throws Error if the network has not been built yet with buildRouteGraph(network).
      */
    public getRoute(
        start: Feature<Point>, // Start point feature
        end: Feature<Point> // End point feature
    ): Feature<LineString> | null {
        if (this.network === null) { // Guard: graph must be built first
            throw new Error("Network not built. Please call buildRouteGraph(network) first.");
        }

        // Ensure start/end exist in index maps
        const startIndex = this.getOrCreateIndex(start.geometry.coordinates); // Get or insert start node index
        const endIndex = this.getOrCreateIndex(end.geometry.coordinates); // Get or insert end node index

        // Trivial case: same node
        if (startIndex === endIndex) {
            return null; // No path needed
        }

        // Local aliases
        const coords = this.coordinates; // Alias to coordinates array
        const adj = this.adjacencyList; // Alias to sparse adjacency list (for dynamic nodes)

        // Ensure and init scratch buffers
        const nodeCount = coords.length; // Current number of nodes (may be >= csrNodeCount if new nodes added)
        this.ensureScratch(nodeCount); // Allocate scratch arrays if needed

        // Non-null after ensure
        const gF = this.gScoreScratch!; // forward gScore (from start)
        const gR = this.gScoreRevScratch!; // reverse gScore (from end)
        const prevF = this.cameFromScratch!; // predecessor in forward search
        const nextR = this.cameFromRevScratch!; // successor in reverse search (toward end)
        const visF = this.visitedScratch!;
        const visR = this.visitedRevScratch!;

        gF.fill(Number.POSITIVE_INFINITY, 0, nodeCount);
        gR.fill(Number.POSITIVE_INFINITY, 0, nodeCount);
        prevF.fill(-1, 0, nodeCount);
        nextR.fill(-1, 0, nodeCount);
        visF.fill(0, 0, nodeCount);
        visR.fill(0, 0, nodeCount);

        // Prefer reusing heaps if supported.
        const openFReuse = this.openForward ?? (this.openForward = new this.heapConstructor());
        const openRReuse = this.openReverse ?? (this.openReverse = new this.heapConstructor());

        const openFAny = openFReuse as unknown as { clear?: () => void };
        const openRAny = openRReuse as unknown as { clear?: () => void };
        const canReuse = !!openFAny.clear && !!openRAny.clear;

        const openF2 = canReuse ? openFReuse : new this.heapConstructor();
        const openR2 = canReuse ? openRReuse : new this.heapConstructor();

        if (canReuse) {
            openFAny.clear!();
            openRAny.clear!();
        }

        gF[startIndex] = 0;
        gR[endIndex] = 0;

        // Bidirectional Dijkstra. This keeps correctness simple while saving work by meeting in the middle.
        openF2.insert(0, startIndex);
        openR2.insert(0, endIndex);

        // Best meeting point found so far
        let bestPathCost = Number.POSITIVE_INFINITY;
        let meetingNode = -1;

        // Main bidirectional loop: expand alternately.
        // Stopping rule: if current best path <= minF(openF) + minF(openR) then we can't improve.
        // When peek isn't available (custom heap), we fall back to a looser but safe g-based rule.
        let lastExtractedGForward = 0;
        let lastExtractedGReverse = 0;
        while (openF2.size() > 0 && openR2.size() > 0) {
            if (meetingNode >= 0) {
                const openFPeek = openF2 as unknown as { peekMinKey?: () => number };
                const openRPeek = openR2 as unknown as { peekMinKey?: () => number };
                if (openFPeek.peekMinKey && openRPeek.peekMinKey) {
                    // Heaps are keyed by g, so this is the standard bidirectional Dijkstra bound.
                    if ((openFPeek.peekMinKey() + openRPeek.peekMinKey()) >= bestPathCost) break;
                } else {
                    if ((lastExtractedGForward + lastExtractedGReverse) >= bestPathCost) break;
                }
            }

            // Expand one step from each side, prioritizing the smaller frontier.
            const expandForward = openF2.size() <= openR2.size();

            if (expandForward) {
                const current = openF2.extractMin()!;
                if (visF[current] !== 0) continue;
                lastExtractedGForward = gF[current];
                visF[current] = 1;

                // If reverse has finalized this node, we have a candidate meeting.
                if (visR[current] !== 0) {
                    const total = gF[current] + gR[current];
                    if (total < bestPathCost) {
                        bestPathCost = total;
                        meetingNode = current;
                    }
                }

                // Relax neighbors and push newly improved ones
                if (this.csrOffsets && current < this.csrNodeCount) {
                    const csrOffsets = this.csrOffsets!;
                    const csrIndices = this.csrIndices!;
                    const csrDistances = this.csrDistances!;
                    for (let i = csrOffsets[current], endOff = csrOffsets[current + 1]; i < endOff; i++) {
                        const nbNode = csrIndices[i];
                        const tentativeG = gF[current] + csrDistances[i];
                        if (tentativeG < gF[nbNode]) {
                            gF[nbNode] = tentativeG;
                            prevF[nbNode] = current;
                            const otherG = gR[nbNode];
                            if (otherG !== Number.POSITIVE_INFINITY) {
                                const total = tentativeG + otherG;
                                if (total < bestPathCost) { bestPathCost = total; meetingNode = nbNode; }
                            }
                            openF2.insert(tentativeG, nbNode);
                        }
                    }
                } else {
                    const neighbors = adj[current];
                    if (neighbors && neighbors.length) {
                        for (let i = 0, n = neighbors.length; i < n; i++) {
                            const nb = neighbors[i];
                            const nbNode = nb.node;
                            const tentativeG = gF[current] + nb.distance;
                            if (tentativeG < gF[nbNode]) {
                                gF[nbNode] = tentativeG;
                                prevF[nbNode] = current;
                                const otherG = gR[nbNode];
                                if (otherG !== Number.POSITIVE_INFINITY) {
                                    const total = tentativeG + otherG;
                                    if (total < bestPathCost) { bestPathCost = total; meetingNode = nbNode; }
                                }
                                openF2.insert(tentativeG, nbNode);
                            }
                        }
                    }
                }
            } else {
                const current = openR2.extractMin()!;
                if (visR[current] !== 0) continue;
                lastExtractedGReverse = gR[current];
                visR[current] = 1;

                if (visF[current] !== 0) {
                    const total = gF[current] + gR[current];
                    if (total < bestPathCost) {
                        bestPathCost = total;
                        meetingNode = current;
                    }
                }

                // Reverse direction: same neighbor iteration because graph is undirected.
                // Store successor pointer (next step toward end) i.e. nextR[neighbor] = current.
                if (this.csrOffsets && current < this.csrNodeCount) {
                    const csrOffsets = this.csrOffsets!;
                    const csrIndices = this.csrIndices!;
                    const csrDistances = this.csrDistances!;
                    for (let i = csrOffsets[current], endOff = csrOffsets[current + 1]; i < endOff; i++) {
                        const nbNode = csrIndices[i];
                        const tentativeG = gR[current] + csrDistances[i];
                        if (tentativeG < gR[nbNode]) {
                            gR[nbNode] = tentativeG;
                            nextR[nbNode] = current;
                            const otherG = gF[nbNode];
                            if (otherG !== Number.POSITIVE_INFINITY) {
                                const total = tentativeG + otherG;
                                if (total < bestPathCost) { bestPathCost = total; meetingNode = nbNode; }
                            }
                            openR2.insert(tentativeG, nbNode);
                        }
                    }
                } else {
                    const neighbors = adj[current];
                    if (neighbors && neighbors.length) {
                        for (let i = 0, n = neighbors.length; i < n; i++) {
                            const nb = neighbors[i];
                            const nbNode = nb.node;
                            const tentativeG = gR[current] + nb.distance;
                            if (tentativeG < gR[nbNode]) {
                                gR[nbNode] = tentativeG;
                                nextR[nbNode] = current;
                                const otherG = gF[nbNode];
                                if (otherG !== Number.POSITIVE_INFINITY) {
                                    const total = tentativeG + otherG;
                                    if (total < bestPathCost) { bestPathCost = total; meetingNode = nbNode; }
                                }
                                openR2.insert(tentativeG, nbNode);
                            }
                        }
                    }
                }
            }
        }

        if (meetingNode < 0) {
            return null;
        }

        // Reconstruct path: start -> meeting using prevF, then meeting -> end using nextR
        const path: Position[] = [];

        // Walk back from meeting to start, collecting nodes
        let cur = meetingNode;
        while (cur !== startIndex && cur >= 0) {
            path.push(coords[cur]);
            cur = prevF[cur];
        }
        if (cur !== startIndex) {
            // Forward tree doesn't connect start to meeting (shouldn't happen if meeting is valid)
            return null;
        }
        path.push(coords[startIndex]);
        path.reverse();

        // Walk from meeting to end (skip meeting node because it's already included)
        cur = meetingNode;
        while (cur !== endIndex) {
            cur = nextR[cur];
            if (cur < 0) {
                return null;
            }
            path.push(coords[cur]);
        }

        return {
            type: "Feature",
            geometry: { type: "LineString", coordinates: path },
            properties: {},
        };
    }

    /**
     * Helper to index start/end in getRoute.
     */
    private getOrCreateIndex(coord: Position): number { // Ensure a coordinate has a node index, creating if absent
        const lng = coord[0]; // Extract longitude
        const lat = coord[1]; // Extract latitude

        let latMap = this.coordinateIndexMap.get(lng); // Get lat→index map for this longitude
        if (latMap === undefined) { // Create if missing
            latMap = new Map<number, number>();
            this.coordinateIndexMap.set(lng, latMap);
        }

        let index = latMap.get(lat); // Lookup index by latitude
        if (index === undefined) { // If not found, append new node

            index = this.coordinates.length; // New index at end
            this.coordinates.push(coord); // Store coordinate
            latMap.set(lat, index); // Record mapping

            // Ensure sparse adjacency slot for dynamically added nodes
            this.adjacencyList[index] = []; // Init empty neighbor array

            // Extend CSR offsets to keep indices consistent (no neighbors for new node)
            if (this.csrOffsets) { // Only adjust if CSR already built

                // Only need to expand offsets by one; indices/distances remain unchanged
                const oldCount = this.csrNodeCount; // Nodes currently covered by CSR

                // Appending exactly one new node at the end
                if (index === oldCount) {
                    const newOffsets = new Int32Array(oldCount + 2); // Allocate offsets for +1 node
                    newOffsets.set(this.csrOffsets, 0); // Copy previous offsets

                    // Last offset repeats to indicate zero neighbors
                    newOffsets[oldCount + 1] = newOffsets[oldCount]; // Replicate last pointer
                    this.csrOffsets = newOffsets; // Swap in new offsets
                    this.csrNodeCount = oldCount + 1; // Increment CSR node count
                }
            }
        }

        return index;
    }

    // Ensure scratch arrays are allocated with at least `size` capacity.
    private ensureScratch(size: number): void {
        const ifAlreadyBigEnough = this.scratchCapacity >= size
            && this.gScoreScratch
            && this.cameFromScratch
            && this.visitedScratch
            && this.gScoreRevScratch
            && this.cameFromRevScratch
            && this.visitedRevScratch;

        if (ifAlreadyBigEnough) {
            return; // Nothing to do
        }
        const capacity = size | 0; // Ensure integer
        this.gScoreScratch = new Float64Array(capacity);
        this.cameFromScratch = new Int32Array(capacity);
        this.visitedScratch = new Uint8Array(capacity);
        this.gScoreRevScratch = new Float64Array(capacity);
        this.cameFromRevScratch = new Int32Array(capacity);
        this.visitedRevScratch = new Uint8Array(capacity);
        this.scratchCapacity = capacity;
    }


    // Iterate all consecutive segment pairs in a LineString FeatureCollection.
    // Kept as a simple loop helper to avoid repeating nested iteration logic.
    private forEachSegment(
        network: FeatureCollection<LineString>,
        fn: (a: Position, b: Position) => void,
    ): void {
        const features = network.features;
        for (let f = 0, fLen = features.length; f < fLen; f++) {
            const lineCoords = features[f].geometry.coordinates;
            for (let i = 0, len = lineCoords.length - 1; i < len; i++) {
                // GeoJSON coordinates are compatible with Position (number[]), and the project assumes [lng,lat]
                fn(lineCoords[i] as Position, lineCoords[i + 1] as Position);
            }
        }
    }

    // Hot-path coordinate indexer used by both build/expand.
    // Accepts explicit maps/arrays so callers can hoist them once.
    private indexCoordinate(
        coord: Position,
        coordIndexMapLocal: Map<number, Map<number, number>>,
        coordsLocal: Position[],
        onNewIndex?: (index: number) => void,
    ): number {
        const lng = coord[0];
        const lat = coord[1];

        let latMap = coordIndexMapLocal.get(lng);
        if (latMap === undefined) {
            latMap = new Map<number, number>();
            coordIndexMapLocal.set(lng, latMap);
        }

        let idx = latMap.get(lat);
        if (idx === undefined) {
            idx = coordsLocal.length;
            coordsLocal.push(coord);
            latMap.set(lat, idx);
            if (onNewIndex) onNewIndex(idx);
        }

        return idx;
    }

}

export { TerraRoute, createCheapRuler, haversineDistance }  