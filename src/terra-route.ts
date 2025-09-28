import { FeatureCollection, LineString, Point, Feature, Position } from "geojson"; // Import GeoJSON types
import { haversineDistance } from "./distance/haversine"; // Great-circle distance function (default heuristic/edge weight)
import { createCheapRuler } from "./distance/cheap-ruler"; // Factory for faster planar distance (exported for consumers)
import { HeapConstructor } from "./heap/heap"; // Heap interface so users can plug custom heaps
import { FourAryHeap } from "./heap/four-ary-heap";

interface Router {
    buildRouteGraph(network: FeatureCollection<LineString>): void;
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

    // Reusable typed scratch buffers for A*
    private gScoreScratch: Float64Array | null = null; // gScore per node (cost from start)
    private cameFromScratch: Int32Array | null = null; // Predecessor per node for path reconstruction
    private visitedScratch: Uint8Array | null = null; // Visited set to avoid reprocessing
    private hScratch: Float64Array | null = null; // Per-node heuristic cache for the current query (lazy compute)
    private scratchCapacity = 0; // Current capacity of scratch arrays

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

        const features = network.features; // All LineString features

        // Pass 1: assign indices and count degrees per node
        const degree: number[] = []; // Dynamic degree array; grows as nodes are discovered
        for (let f = 0, fLen = features.length; f < fLen; f++) { // Iterate features
            const feature = features[f]; // Current feature
            const lineCoords = feature.geometry.coordinates; // Coordinates for this LineString

            for (let i = 0, len = lineCoords.length - 1; i < len; i++) { // Iterate segment pairs
                const a = lineCoords[i]; // Segment start coord
                const b = lineCoords[i + 1]; // Segment end coord

                const lngA = a[0], latA = a[1]; // Keys for A
                const lngB = b[0], latB = b[1]; // Keys for B

                // Index A
                let latMapA = coordIndexMapLocal.get(lngA);
                if (latMapA === undefined) {
                    latMapA = new Map<number, number>();
                    coordIndexMapLocal.set(lngA, latMapA);
                }
                let indexA = latMapA.get(latA);
                if (indexA === undefined) {
                    indexA = coordsLocal.length;
                    coordsLocal.push(a);
                    latMapA.set(latA, indexA);
                }

                // Index B
                let latMapB = coordIndexMapLocal.get(lngB);
                if (latMapB === undefined) {
                    latMapB = new Map<number, number>();
                    coordIndexMapLocal.set(lngB, latMapB);
                }
                let indexB = latMapB.get(latB);
                if (indexB === undefined) {
                    indexB = coordsLocal.length;
                    coordsLocal.push(b);
                    latMapB.set(latB, indexB);
                }

                // Count degree for both directions
                degree[indexA] = (degree[indexA] ?? 0) + 1;
                degree[indexB] = (degree[indexB] ?? 0) + 1;
            }
        }

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
        for (let f = 0, fLen = features.length; f < fLen; f++) {
            const feature = features[f];
            const lineCoords = feature.geometry.coordinates;
            for (let i = 0, len = lineCoords.length - 1; i < len; i++) {
                const a = lineCoords[i];
                const b = lineCoords[i + 1];

                const lngA = a[0], latA = a[1];
                const lngB = b[0], latB = b[1];

                // Read back indices (guaranteed to exist from pass 1)
                const indexA = this.coordinateIndexMap.get(lngA)!.get(latA)!;
                const indexB = this.coordinateIndexMap.get(lngB)!.get(latB)!;

                const segmentDistance = measureDistance(a, b); // Edge weight once

                // Write A → B
                let pos = cursor[indexA]++;
                indices[pos] = indexB;
                distances[pos] = segmentDistance;
                // Write B → A
                pos = cursor[indexB]++;
                indices[pos] = indexA;
                distances[pos] = segmentDistance;
            }
        }

        // Commit CSR to instance
        this.csrOffsets = offsets;
        this.csrIndices = indices;
        this.csrDistances = distances;

        // Prepare sparse shell only for dynamically added nodes later (no prefilled neighbor arrays)
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
        const measureDistance = this.distanceMeasurement; // Alias to distance function

        // Ensure and init scratch buffers
        const nodeCount = coords.length; // Current number of nodes (may be >= csrNodeCount if new nodes added)
        this.ensureScratch(nodeCount); // Allocate scratch arrays if needed

        // Non-null after ensure
        const gScore = this.gScoreScratch!; // gScore pointer
        const cameFrom = this.cameFromScratch!; // cameFrom pointer
        const visited = this.visitedScratch!; // visited pointer
        const hCache = this.hScratch!; // heuristic cache pointer

        // Reset only the used range for speed
        gScore.fill(Number.POSITIVE_INFINITY, 0, nodeCount); // Init gScore to +∞
        cameFrom.fill(-1, 0, nodeCount); // Init predecessors to -1 (unknown)
        visited.fill(0, 0, nodeCount); // Init visited flags to 0
        hCache.fill(-1, 0, nodeCount); // Init heuristic cache with sentinel (-1 means unknown)

        // Create min-heap (priority queue)
        const openSet = new this.heapConstructor();

        // Precompute heuristic for start to prime the queue cost
        const endCoord = coords[endIndex]; // Cache end coordinate for heuristic
        let hStart = hCache[startIndex];

        if (hStart < 0) {
            hStart = measureDistance(coords[startIndex], endCoord);
            hCache[startIndex] = hStart;
        }

        openSet.insert(hStart, startIndex); // Insert start with f = g(0) + h(start)
        gScore[startIndex] = 0; // g(start) = 0

        while (openSet.size() > 0) { // Main A* loop until queue empty
            const current = openSet.extractMin()!; // Pop node with smallest f
            if (visited[current] !== 0) { // Skip if already finalized
                continue;
            }
            if (current === endIndex) { // Early exit if reached goal
                break;
            }
            visited[current] = 1; // Mark as visited

            // Prefer CSR neighbors if available for this node, fall back to sparse list for dynamically added nodes

            if (this.csrOffsets && current < this.csrNodeCount) { // Use CSR fast path
                const csrOffsets = this.csrOffsets!; // Local CSR offsets (non-null here)
                const csrIndices = this.csrIndices!; // Local CSR neighbors
                const csrDistances = this.csrDistances!; // Local CSR weights
                const startOff = csrOffsets[current]; // Row start for current
                const endOff = csrOffsets[current + 1]; // Row end for current

                for (let i = startOff; i < endOff; i++) { // Iterate neighbors in CSR slice
                    const nbNode = csrIndices[i]; // Neighbor node id
                    const tentativeG = gScore[current] + csrDistances[i]; // g' = g(current) + w(current, nb)
                    if (tentativeG < gScore[nbNode]) { // Relaxation check
                        gScore[nbNode] = tentativeG; // Update best g
                        cameFrom[nbNode] = current; // Track predecessor
                        // A* priority = g + h (cache h per node for this query)
                        let hVal = hCache[nbNode];
                        if (hVal < 0) { hVal = measureDistance(coords[nbNode], endCoord); hCache[nbNode] = hVal; }
                        openSet.insert(tentativeG + hVal, nbNode); // Push/update neighbor into open set
                    }
                }
            }
            // Fallback: use sparse adjacency (only for nodes added after CSR build)
            else {

                const neighbors = adj[current]; // Neighbor list for current
                if (!neighbors || neighbors.length === 0) continue; // No neighbors
                for (let i = 0, n = neighbors.length; i < n; i++) { // Iterate neighbors
                    const nb = neighbors[i]; // Neighbor entry
                    const nbNode = nb.node; // Neighbor id

                    const tentativeG = gScore[current] + nb.distance; // g' via current
                    if (tentativeG < gScore[nbNode]) { // Relax if better
                        gScore[nbNode] = tentativeG; // Update best g
                        cameFrom[nbNode] = current; // Track predecessor

                        // A* priority = g + h (cached)
                        let hVal = hCache[nbNode];
                        if (hVal < 0) { hVal = measureDistance(coords[nbNode], endCoord); hCache[nbNode] = hVal; }
                        openSet.insert(tentativeG + hVal, nbNode); // Enqueue neighbor
                    }
                }
            }
        }

        // If goal was never reached/relaxed, return null
        if (cameFrom[endIndex] < 0) {
            return null;
        }

        // Reconstruct path (push + reverse to avoid O(n^2) unshift)
        const path: Position[] = [];
        let cur = endIndex;
        while (cur !== startIndex) {
            path.push(coords[cur]);
            cur = cameFrom[cur];
        }
        // Include start coordinate
        path.push(coords[startIndex]);

        // Reverse to get start→end order
        path.reverse();

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
            && this.hScratch;

        if (ifAlreadyBigEnough) {
            return; // Nothing to do
        }
        const capacity = size | 0; // Ensure integer
        this.gScoreScratch = new Float64Array(capacity);
        this.cameFromScratch = new Int32Array(capacity);
        this.visitedScratch = new Uint8Array(capacity);
        this.hScratch = new Float64Array(capacity);
        this.scratchCapacity = capacity;
    }
}

export { TerraRoute, createCheapRuler, haversineDistance }  