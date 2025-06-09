import { FeatureCollection, LineString, Point, Feature, Position } from "geojson";
import { haversineDistance } from "./distance/haversine";
import { createCheapRuler } from "./distance/cheap-ruler";
import { MinHeap } from "./heap/min-heap";
import { HeapConstructor } from "./heap/heap";

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

    constructor(options?: {
        distanceMeasurement?: (a: Position, b: Position) => number;
        heap?: HeapConstructor;
    }) {
        this.distanceMeasurement = options?.distanceMeasurement ?? haversineDistance;
        this.heapConstructor = options?.heap ?? MinHeap;
    }

    /**
     * Converts a coordinate into a unique index. If the coordinate already exists, returns its index.
     * Otherwise, assigns a new index and stores the coordinate.
     * 
     * @param coord - A GeoJSON Position array representing [longitude, latitude].
     * @returns A unique numeric index for the coordinate.
     */
    public buildRouteGraph(network: FeatureCollection<LineString>): void {
        this.network = network;

        // Reset everything
        this.coordinateIndexMap = new Map();
        this.coordinates = [];
        this.adjacencyList = [];

        // Hoist to locals for speed
        const coordIndexMapLocal = this.coordinateIndexMap;
        const coordsLocal = this.coordinates;
        const adjListLocal = this.adjacencyList;
        const measureDistance = this.distanceMeasurement;

        for (const feature of network.features) {
            const lineCoords = feature.geometry.coordinates;

            for (let i = 0; i < lineCoords.length - 1; i++) {
                const [lngA, latA] = lineCoords[i];
                const [lngB, latB] = lineCoords[i + 1];

                // get or assign index for A 
                let latMapA = coordIndexMapLocal.get(lngA);
                if (!latMapA) {
                    latMapA = new Map<number, number>();
                    coordIndexMapLocal.set(lngA, latMapA);
                }
                let indexA = latMapA.get(latA);
                if (indexA === undefined) {
                    indexA = coordsLocal.length;
                    coordsLocal.push(lineCoords[i]);
                    latMapA.set(latA, indexA);
                    adjListLocal[indexA] = [];
                }

                // get or assign index for B 
                let latMapB = coordIndexMapLocal.get(lngB);
                if (!latMapB) {
                    latMapB = new Map<number, number>();
                    coordIndexMapLocal.set(lngB, latMapB);
                }
                let indexB = latMapB.get(latB);
                if (indexB === undefined) {
                    indexB = coordsLocal.length;
                    coordsLocal.push(lineCoords[i + 1]);
                    latMapB.set(latB, indexB);
                    adjListLocal[indexB] = [];
                }

                // record the bidirectional edge 
                const segmentDistance = measureDistance(lineCoords[i], lineCoords[i + 1]);
                adjListLocal[indexA].push({ node: indexB, distance: segmentDistance });
                adjListLocal[indexB].push({ node: indexA, distance: segmentDistance });
            }
        }
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
        start: Feature<Point>,
        end: Feature<Point>
    ): Feature<LineString> | null {
        if (!this.network) {
            throw new Error("Network not built. Please call buildRouteGraph(network) first.");
        }

        // ensure start/end are in the index maps
        const startIndex = this.getOrCreateIndex(start.geometry.coordinates);
        const endIndex = this.getOrCreateIndex(end.geometry.coordinates);

        if (startIndex === endIndex) {
            return null;
        }

        const openSet = new this.heapConstructor();
        openSet.insert(0, startIndex);

        const nodeCount = this.coordinates.length;
        const gScore = new Array<number>(nodeCount).fill(Infinity);
        const cameFrom = new Array<number>(nodeCount).fill(-1);
        const visited = new Array<boolean>(nodeCount).fill(false);

        gScore[startIndex] = 0;

        while (openSet.size() > 0) {
            const current = openSet.extractMin()!;
            if (visited[current]) {
                continue;
            }
            if (current === endIndex) {
                break;
            }
            visited[current] = true;

            for (const neighbor of this.adjacencyList[current] || []) {
                const tentativeG = gScore[current] + neighbor.distance;
                if (tentativeG < gScore[neighbor.node]) {
                    gScore[neighbor.node] = tentativeG;
                    cameFrom[neighbor.node] = current;
                    const heuristic = this.distanceMeasurement(
                        this.coordinates[neighbor.node],
                        this.coordinates[endIndex]
                    );
                    openSet.insert(tentativeG + heuristic, neighbor.node);
                }
            }
        }

        if (cameFrom[endIndex] < 0) {
            return null;
        }

        // Reconstruct path
        const path: Position[] = [];
        let current = endIndex;
        while (current !== startIndex) {
            path.unshift(this.coordinates[current]);
            current = cameFrom[current];
        }
        path.unshift(this.coordinates[startIndex]);

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
        const [lng, lat] = coord;
        let latMap = this.coordinateIndexMap.get(lng);
        if (!latMap) {
            latMap = new Map<number, number>();
            this.coordinateIndexMap.set(lng, latMap);
        }
        let index = latMap.get(lat);
        if (index === undefined) {
            index = this.coordinates.length;
            this.coordinates.push(coord);
            latMap.set(lat, index);
            // ensure adjacencyList covers this new node
            this.adjacencyList[index] = [];
        }
        return index;
    }
}

export { TerraRoute, createCheapRuler, haversineDistance }