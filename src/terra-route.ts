import { FeatureCollection, LineString, Point, Feature, Position } from "geojson";
import { FibonacciHeap } from "./fibonacci-heap";
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

        const index = this.coords.length;
        this.coords.push(coord);
        latMap.set(lat, index);

        return index;
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
    * Computes the shortest route between two points in the network using bidirectional A* algorithm.
    * 
    * @param start - A GeoJSON Point Feature representing the start location.
    * @param end - A GeoJSON Point Feature representing the end location.
    * @returns A GeoJSON LineString Feature representing the shortest path, or null if no path is found.
    * 
    * @throws Error if the network has not been built yet with buildRouteGraph(network).
    */
    public getRoute(start: Feature<Point>, end: Feature<Point>): Feature<LineString> | null {
        if (!this.network) {
            throw new Error("Network not built. Please call buildRouteGraph(network) first.");
        }

        const startIndex = this.coordinateIndex(start.geometry.coordinates);
        const endIndex = this.coordinateIndex(end.geometry.coordinates);

        if (startIndex === endIndex) {
            return null;
        }

        const openSetForward = new FibonacciHeap();
        const openSetBackward = new FibonacciHeap();
        openSetForward.insert(0, startIndex);
        openSetBackward.insert(0, endIndex);

        const cameFromForward = new Map<number, number>();
        const cameFromBackward = new Map<number, number>();
        const gScoreForward = new Map<number, number>([[startIndex, 0]]);
        const gScoreBackward = new Map<number, number>([[endIndex, 0]]);

        const visitedForward = new Set<number>();
        const visitedBackward = new Set<number>();

        let meetingNode: number | null = null;

        while (openSetForward.size() > 0 && openSetBackward.size() > 0) {
            const currentForward = openSetForward.extractMin()!;
            visitedForward.add(currentForward);

            if (visitedBackward.has(currentForward)) {
                meetingNode = currentForward;
                break;
            }

            for (const neighbor of this.adjacencyList.get(currentForward) || []) {
                const tentativeG = (gScoreForward.get(currentForward) ?? Infinity) + neighbor.distance;
                if (tentativeG < (gScoreForward.get(neighbor.node) ?? Infinity)) {
                    cameFromForward.set(neighbor.node, currentForward);
                    gScoreForward.set(neighbor.node, tentativeG);
                    const fScore = tentativeG + this.distanceMeasurement(this.coords[neighbor.node], this.coords[endIndex]);
                    openSetForward.insert(fScore, neighbor.node);
                }
            }

            const currentBackward = openSetBackward.extractMin()!;
            visitedBackward.add(currentBackward);

            if (visitedForward.has(currentBackward)) {
                meetingNode = currentBackward;
                break;
            }

            for (const neighbor of this.adjacencyList.get(currentBackward) || []) {
                const tentativeG = (gScoreBackward.get(currentBackward) ?? Infinity) + neighbor.distance;
                if (tentativeG < (gScoreBackward.get(neighbor.node) ?? Infinity)) {
                    cameFromBackward.set(neighbor.node, currentBackward);
                    gScoreBackward.set(neighbor.node, tentativeG);
                    const fScore = tentativeG + this.distanceMeasurement(this.coords[neighbor.node], this.coords[startIndex]);
                    openSetBackward.insert(fScore, neighbor.node);
                }
            }
        }

        if (meetingNode === null) {
            return null;
        }

        // Reconstruct forward path
        const pathForward: Position[] = [];
        let node = meetingNode;
        while (node !== undefined) {
            pathForward.unshift(this.coords[node]);
            node = cameFromForward.get(node)!;
        }

        // Reconstruct backward path (omit meeting node to avoid duplication)
        const pathBackward: Position[] = [];
        node = cameFromBackward.get(meetingNode)!;
        while (node !== undefined) {
            pathBackward.push(this.coords[node]);
            node = cameFromBackward.get(node)!;
        }

        const fullPath = [...pathForward, ...pathBackward];

        return {
            type: "Feature",
            geometry: { type: "LineString", coordinates: fullPath },
            properties: {},
        };
    }
}

export { TerraRoute, createCheapRuler, haversineDistance }