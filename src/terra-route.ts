import { FeatureCollection, LineString, Point, Feature, Position } from "geojson";
import { haversineDistance } from "./distance/haversine";
import { createCheapRuler } from "./distance/cheap-ruler";
import { MinHeap } from "./heap/min-heap";
import { HeapConstructor } from "./heap/heap";
import { LineStringGraph } from "./graph/graph";

interface Router {
    buildRouteGraph(network: FeatureCollection<LineString>): void;
    getRoute(start: Feature<Point>, end: Feature<Point>): Feature<LineString> | null;
}

class TerraRoute implements Router {
    private network: FeatureCollection<LineString> | null = null;
    private distanceMeasurement: (a: Position, b: Position) => number;
    private heapConstructor: HeapConstructor;

    // Map from longitude → (map from latitude → index)
    private coordinateIndexMap: Map<number, Map<number, number>> = new Map();
    private coordinates: Position[] = [];
    private adjacencyList: Array<Array<{ node: number; distance: number }>> = [];

    // Reusable typed scratch buffers for A*
    private gScoreScratch: Float64Array | null = null;
    private cameFromScratch: Int32Array | null = null;
    private visitedScratch: Uint8Array | null = null;
    private scratchCapacity = 0;

    constructor(options?: {
        distanceMeasurement?: (a: Position, b: Position) => number;
        heap?: HeapConstructor;
    }) {
        this.distanceMeasurement = options?.distanceMeasurement ?? haversineDistance;
        this.heapConstructor = options?.heap ?? MinHeap;
    }

    /**
     * Builds a graph (adjacency list) from a LineString FeatureCollection.
     */
    public buildRouteGraph(network: FeatureCollection<LineString>): void {
        this.network = network;

        // Reset
        this.coordinateIndexMap = new Map();
        this.coordinates = [];
        this.adjacencyList = [];

        // Hoist to locals for speed
        const coordIndexMapLocal = this.coordinateIndexMap;
        const coordsLocal = this.coordinates;
        const adjListLocal = this.adjacencyList;
        const measureDistance = this.distanceMeasurement;

        const features = network.features;
        for (let f = 0, fLen = features.length; f < fLen; f++) {
            const feature = features[f];
            const lineCoords = feature.geometry.coordinates;

            for (let i = 0, len = lineCoords.length - 1; i < len; i++) {
                const a = lineCoords[i];
                const b = lineCoords[i + 1];

                const lngA = a[0], latA = a[1];
                const lngB = b[0], latB = b[1];

                // get or assign index for A
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
                    adjListLocal[indexA] = [];
                }

                // get or assign index for B
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
                    adjListLocal[indexB] = [];
                }

                // record the bidirectional edge
                const segmentDistance = measureDistance(a, b);
                adjListLocal[indexA].push({ node: indexB, distance: segmentDistance });
                adjListLocal[indexB].push({ node: indexA, distance: segmentDistance });
            }
        }
    }

    /**
     * Computes the shortest route between two points using A*.
     */
    public getRoute(
        start: Feature<Point>,
        end: Feature<Point>
    ): Feature<LineString> | null {
        if (this.network === null) {
            throw new Error("Network not built. Please call buildRouteGraph(network) first.");
        }

        // Ensure start/end exist in index maps
        const startIndex = this.getOrCreateIndex(start.geometry.coordinates);
        const endIndex = this.getOrCreateIndex(end.geometry.coordinates);

        if (startIndex === endIndex) {
            return null;
        }

        // Local aliases
        const coords = this.coordinates;
        const adj = this.adjacencyList;
        const measureDistance = this.distanceMeasurement;

        // Ensure and init scratch buffers
        const nodeCount = coords.length;
        this.ensureScratch(nodeCount);
        // Non-null after ensure
        const gScore = this.gScoreScratch!;
        const cameFrom = this.cameFromScratch!;
        const visited = this.visitedScratch!;
        // Reset only the used range for speed
        gScore.fill(Number.POSITIVE_INFINITY, 0, nodeCount);
        cameFrom.fill(-1, 0, nodeCount);
        visited.fill(0, 0, nodeCount);

        const openSet = new this.heapConstructor();
        openSet.insert(0, startIndex);
        gScore[startIndex] = 0;

        const endCoord = coords[endIndex];

        while (openSet.size() > 0) {
            const current = openSet.extractMin()!;
            if (visited[current] !== 0) {
                continue;
            }
            if (current === endIndex) {
                break;
            }
            visited[current] = 1;

            const neighbors = adj[current];
            if (neighbors === undefined) continue;

            for (let i = 0, n = neighbors.length; i < n; i++) {
                const nb = neighbors[i];
                const nbNode = nb.node;

                const tentativeG = gScore[current] + nb.distance;
                if (tentativeG < gScore[nbNode]) {
                    gScore[nbNode] = tentativeG;
                    cameFrom[nbNode] = current;

                    // A* priority = g + h
                    const heuristic = measureDistance(coords[nbNode], endCoord);
                    openSet.insert(tentativeG + heuristic, nbNode);
                }
            }
        }

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
        path.push(coords[startIndex]);
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
    private getOrCreateIndex(coord: Position): number {
        const lng = coord[0];
        const lat = coord[1];

        let latMap = this.coordinateIndexMap.get(lng);
        if (latMap === undefined) {
            latMap = new Map<number, number>();
            this.coordinateIndexMap.set(lng, latMap);
        }

        let index = latMap.get(lat);
        if (index === undefined) {
            index = this.coordinates.length;
            this.coordinates.push(coord);
            latMap.set(lat, index);
            this.adjacencyList[index] = [];
        }

        return index;
    }

    // Ensure scratch arrays are allocated with at least `size` capacity.
    private ensureScratch(size: number): void {
        if (this.scratchCapacity >= size && this.gScoreScratch && this.cameFromScratch && this.visitedScratch) {
            return;
        }
        const cap = size | 0;
        this.gScoreScratch = new Float64Array(cap);
        this.cameFromScratch = new Int32Array(cap);
        this.visitedScratch = new Uint8Array(cap);
        this.scratchCapacity = cap;
    }
}

export { TerraRoute, createCheapRuler, haversineDistance, LineStringGraph }