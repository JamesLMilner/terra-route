import { FeatureCollection, LineString, Point, Feature, Position } from "geojson";
import { haversineDistance } from "./distance/haversine";
import { createCheapRuler } from "./distance/cheap-ruler";
import { MinHeap } from "./heap/min-heap";
import { HeapConstructor } from "./heap/heap";

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
    private heap: HeapConstructor;

    /**
     * Creates a new instance of TerraRoute.
     * 
     * @param distanceMeasurement - Optional custom distance measurement function (defaults to haversine distance).
     */
    constructor(options?: {
        distanceMeasurement?: (positionA: Position, positionB: Position) => number,
        heap?: HeapConstructor
    }) {
        this.heap = options?.heap ? options.heap : MinHeap
        this.distanceMeasurement = options?.distanceMeasurement ? options.distanceMeasurement : haversineDistance;
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

        const index = this.coords.length;
        this.coords.push(coord);
        latMap.set(lat, index);

        return index;
    }

    /**
     * Builds the internal graph representation (adjacency list) from the input network.
     * Each LineString segment is translated into graph edges with associated distances.
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
                const aIndex = this.coordinateIndex(coords[i]);
                const bIndex = this.coordinateIndex(coords[i + 1]);
                const distance = this.distanceMeasurement(coords[i], coords[i + 1]);

                if (!this.adjacencyList.has(aIndex)) this.adjacencyList.set(aIndex, []);
                if (!this.adjacencyList.has(bIndex)) this.adjacencyList.set(bIndex, []);

                this.adjacencyList.get(aIndex)!.push({ node: bIndex, distance });
                this.adjacencyList.get(bIndex)!.push({ node: aIndex, distance });
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

        const startIndex = this.coordinateIndex(start.geometry.coordinates);
        const endIndex = this.coordinateIndex(end.geometry.coordinates);

        if (startIndex === endIndex) {
            return null;
        }

        const openSet = new this.heap();
        openSet.insert(0, startIndex);

        const cameFrom = new Map<number, number>();
        const gScore = new Map<number, number>([[startIndex, 0]]);
        const visited = new Set<number>();

        while (openSet.size() > 0) {
            // Extract the node with the smallest fScore
            const current = openSet.extractMin()!;

            // Skip nodes we've already processed
            if (visited.has(current)) {
                continue;
            }

            // If we've reached the end node, we're done
            if (current === endIndex) {
                break;
            }

            visited.add(current);

            // Explore neighbors
            for (const neighbor of this.adjacencyList.get(current) || []) {
                // Tentative cost from start to this neighbor
                const tentativeG = (gScore.get(current) ?? Infinity) + neighbor.distance;

                // If this path to neighbor is better, record it
                if (tentativeG < (gScore.get(neighbor.node) ?? Infinity)) {
                    cameFrom.set(neighbor.node, current);
                    gScore.set(neighbor.node, tentativeG);

                    // Calculate fScore: gScore + heuristic distance to the end
                    const fScore =
                        tentativeG +
                        this.distanceMeasurement(this.coords[neighbor.node], this.coords[endIndex]);

                    openSet.insert(fScore, neighbor.node);
                }
            }
        }

        // If we never set a path to the end node, there's no route
        if (!cameFrom.has(endIndex)) {
            return null;
        }

        // Reconstruct the path from end node to start node
        const path: Position[] = [];
        let node = endIndex;

        while (node !== undefined) {
            path.unshift(this.coords[node]);
            node = cameFrom.get(node)!;
        }

        return {
            type: "Feature",
            geometry: { type: "LineString", coordinates: path },
            properties: {},
        };
    }

}

export { TerraRoute, createCheapRuler, haversineDistance }