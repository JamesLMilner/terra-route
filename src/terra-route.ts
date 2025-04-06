import { FeatureCollection, LineString, Point, Feature, Position } from "geojson";
import { MinHeap } from "./min-heap";
import { haversineDistance } from "./distance/haversine";
import { createCheapRuler } from "./distance/cheap-ruler";

/**
 * TerraRoute is a routing utility for finding the shortest path
 * between two geographic points over a given GeoJSON LineString network.
 *
 * The class builds an internal graph structure based on the provided network,
 * then applies A* algorithm to compute the shortest route.
 */
class TerraRoute {
    private network: FeatureCollection<LineString> | undefined;
    private distanceMeasurement: (positionA: Position, positionB: Position) => number;
    private adjacencyList: Map<number, Array<{ node: number; distance: number }>> = new Map();
    private coords: Position[] = []
    private coordMap: Map<number, Map<number, number>> = new Map();

    /**
     * Creates a new instance of TerraRoute.
     * 
     * @param distanceMeasurement - Optional custom distance measurement function (defaults to haversine distance).
     */
    constructor(
        distanceMeasurement?: (positionA: Position, positionB: Position) => number
    ) {
        this.distanceMeasurement = distanceMeasurement ? distanceMeasurement : haversineDistance;
    }

    /**
     * Converts a coordinate into a unique index. If the coordinate already exists, returns its index.
     * Otherwise, assigns a new index and stores the coordinate.
     * 
     * @param coord - A GeoJSON Position array representing [longitude, latitude].
     * @returns A unique numeric index for the coordinate.
     */
    private coordinateIndex(coord: Position): number {
        const [lng, lat] = coord;
        if (!this.coordMap.has(lng)) this.coordMap.set(lng, new Map());

        const latMap = this.coordMap.get(lng)!;
        if (latMap.has(lat)) {
            return latMap.get(lat)!;
        }

        const idx = this.coords.length;
        this.coords.push(coord);
        latMap.set(lat, idx);

        return idx;
    }

    /**
     * Builds the internal graph representation (adjacency list) from the input network.
     * Each LineString segment is translated into bidirectional graph edges with associated distances.
     * Assumes that the network is a connected graph of LineStrings with shared coordinates. Calling this 
     * method with a new network overwrite any existing network and reset all internal data structures.
     * 
     * @param network - A GeoJSON FeatureCollection of LineStrings representing the road network.
     */
    public buildRouteGraph(network: FeatureCollection<LineString>): void {
        this.network = network;
        this.adjacencyList = new Map();
        this.coords = [];
        this.coordMap = new Map();

        for (const feature of this.network.features) {
            const coords = feature.geometry.coordinates;
            for (let i = 0; i < coords.length - 1; i++) {
                const aIdx = this.coordinateIndex(coords[i]);
                const bIdx = this.coordinateIndex(coords[i + 1]);
                const distance = this.distanceMeasurement(coords[i], coords[i + 1]);

                if (!this.adjacencyList.has(aIdx)) this.adjacencyList.set(aIdx, []);
                if (!this.adjacencyList.has(bIdx)) this.adjacencyList.set(bIdx, []);

                this.adjacencyList.get(aIdx)!.push({ node: bIdx, distance });
                this.adjacencyList.get(bIdx)!.push({ node: aIdx, distance });
            }
        }
    }

    /**
    * Computes the shortest route between two points in the network using A* algorithm.
    * 
    * @param start - A GeoJSON Point Feature representing the start location.
    * @param end - A GeoJSON Point Feature representing the end location.
    * @returns A GeoJSON LineString Feature representing the shortest path, or null if no path is found.
    * 
    * @throws Error if the network has not been built yet with buildRouteGraph(network).
    */
    public getRoute(start: Feature<Point>, end: Feature<Point>): Feature<LineString> | null {
        if (!this.network) {
            throw new Error("Network not built. Please call buildNetworkGraph(network) first.");
        }

        const startIdx = this.coordinateIndex(start.geometry.coordinates);
        const endIdx = this.coordinateIndex(end.geometry.coordinates);

        if (startIdx === endIdx) {
            return null;
        }

        const openSet = new MinHeap();
        openSet.insert(0, startIdx);
        const cameFrom = new Map<number, number>();
        const gScore = new Map<number, number>([[startIdx, 0]]);

        while (openSet.size() > 0) {
            const current = openSet.extractMin()!;

            if (current === endIdx) {
                const path: Position[] = [];
                let currNode: number | undefined = current;
                while (currNode !== undefined) {
                    path.unshift(this.coords[currNode]);
                    currNode = cameFrom.get(currNode);
                }
                return {
                    type: "Feature",
                    geometry: { type: "LineString", coordinates: path },
                    properties: {},
                };
            }

            const neighbors = this.adjacencyList.get(current) || [];

            for (const neighbor of neighbors) {
                const tentativeGScore = (gScore.get(current) ?? Infinity) + neighbor.distance;
                if (tentativeGScore < (gScore.get(neighbor.node) ?? Infinity)) {
                    cameFrom.set(neighbor.node, current);
                    gScore.set(neighbor.node, tentativeGScore);
                    const fScore = tentativeGScore + this.distanceMeasurement(this.coords[neighbor.node], this.coords[endIdx]);
                    openSet.insert(fScore, neighbor.node);
                }
            }
        }

        return null;
    }
}

export { TerraRoute, createCheapRuler, haversineDistance }