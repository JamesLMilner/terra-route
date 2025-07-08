import { Feature, FeatureCollection, LineString, Point } from "geojson";
import { graphGetConnectedComponentCount, graphGetConnectedComponents } from "./methods/connected";
import { graphGetNodeAndEdgeCount, graphGetNodesAsPoints } from "./methods/nodes";
import { graphGetUniqueSegments } from "./methods/unique";
import { routeLength } from "../test-utils/utils";
import { removeDuplicateAndSubsectionLines } from "./methods/duplicates";
import { getLeafEdges } from "./methods/leaf";
import { getNetworkInBoundingBox, BoundingBox } from "./methods/bounding-box";

/**
 * Represents a graph constructed from a GeoJSON FeatureCollection of LineString features.
 * This class provides methods to analyze the graph, including connected components, node and edge counts,
 * and shortest paths. Coordinates in the LineStrings are considered connected if they share identical coordinates.
 */
export class LineStringGraph {
    constructor(network: FeatureCollection<LineString>) {
        this.network = network;
    }

    private network: FeatureCollection<LineString>;

    /**
     * Sets the network for the graph.
     * This method replaces the current network with a new one.
     * @param network A GeoJSON FeatureCollection of LineString features representing the network.
     */
    setNetwork(network: FeatureCollection<LineString>) {
        this.network = network;
    }

    /**
     * Gets the current network of the graph.
     * @returns A GeoJSON FeatureCollection of LineString features representing the network.
     */
    getNetwork(): FeatureCollection<LineString> {
        return this.network;
    }

    /**
     * Gets a filtered network containing only LineStrings that are completely within the specified bounding box.
     * @param boundingBox A bounding box array in the format [minLng, minLat, maxLng, maxLat]
     * @returns A GeoJSON FeatureCollection of LineString features representing the network filtered by the bounding box.
     */
    getNetworkInBoundingBox(boundingBox: BoundingBox): FeatureCollection<LineString> {
        return getNetworkInBoundingBox(this.network, boundingBox);
    }

    /**
     * Gets the network without duplicate or subsection lines. 
     * This method processes the network to remove any duplicate lines or lines that are subsections of other lines.
     * @returns A FeatureCollection<LineString> representing the network without duplicate or subsection lines.
     */
    getNetworkWithoutDuplicatesOrSubsections() {
        return removeDuplicateAndSubsectionLines(this.network);
    }

    /**
     * Gets the connected components of the graph.
     * @returns An array of FeatureCollection<LineString> representing the connected components.
     */
    getConnectedComponents(): FeatureCollection<LineString>[] {
        return graphGetConnectedComponents(this.network)
    }

    /**
     * Gets the count of connected components in the graph.
     * @returns The number of connected components in the graph.
     */
    getConnectedComponentCount(): number {
        return graphGetConnectedComponentCount(this.network);
    }

    /**
     * Gets the count of unique nodes and edges in the graph.
     * @returns An object containing the counts of nodes and edges.
     */
    getNodeAndEdgeCount(): { nodeCount: number, edgeCount: number } {
        return graphGetNodeAndEdgeCount(this.network);
    }

    /**
     * Gets the unique nodes of the graph as a FeatureCollection of Point features.
     * @returns A FeatureCollection<Point> containing the nodes of the graph.
     */
    getNodes(): FeatureCollection<Point> {
        const nodes = graphGetNodesAsPoints(this.network);
        return {
            type: "FeatureCollection",
            features: nodes
        };
    }

    /**
     * Gets the count of unique nodes in the graph.
     * @returns The number of unique nodes in the graph.
     */
    getNodeCount(): number {
        const { nodeCount } = this.getNodeAndEdgeCount();
        return nodeCount;
    }

    /**
     * Gets the unique edges of the graph as a FeatureCollection of LineString features. Each edge is represented as a LineString.
     * This method ensures that each edge is unique, meaning that edges are not duplicated in the collection. Each linestring only 
     * two coordinates, representing the start and end points of the edge.
     * @returns A FeatureCollection<LineString> containing the unique edges of the graph.
     */
    getEdges(): FeatureCollection<LineString> {
        return graphGetUniqueSegments(this.network);
    }

    /**
     * Gets the length of the longest edge in the graph based on the length of the LineString.
     * If no edges exist, it returns -1.
     * @returns The length of the longest edge in meters, or 0 if no edges exist.
     */
    getLongestEdgeLength(): number {
        const longestEdge = this.getLongestEdge();
        if (!longestEdge) {
            return -1;
        }
        return routeLength(longestEdge);
    }

    /**
     * Gets the length of the shortest edge in the graph based on the length of the LineString.
     * If no edges exist, it returns -1.
     * @returns The length of the shortest edge in meters, or 0 if no edges exist.
     */
    getShortestEdgeLength(): number {
        const shortestEdge = this.getShortestEdge();
        if (!shortestEdge) {
            return -1;
        }
        return routeLength(shortestEdge);
    }

    /**
     * Gets the longest edge in the graph based on the length of the LineString.
     * @returns The longest edge as a Feature<LineString> or null if no edges exist.
     */
    getLongestEdge(): Feature<LineString> | null {
        const edges = this.getEdges().features;
        if (edges.length === 0) {
            return null;
        }
        const longestEdges = edges.sort((a, b) => routeLength(a) - routeLength(b));
        return longestEdges[longestEdges.length - 1];
    }

    /**
     * Gets the shortest edge in the graph based on the length of the LineString.
     * @returns The shortest edge as a Feature<LineString> or null if no edges exist.
     */
    getShortestEdge(): Feature<LineString> | null {
        const edges = this.getEdges().features;
        if (edges.length === 0) {
            return null;
        }
        const shortestEdges = edges.sort((a, b) => routeLength(a) - routeLength(b));
        return shortestEdges[0];
    }

    /**
     * Gets the count of unique edges in the graph.
     * @returns The number of unique edges in the graph.
     */
    getEdgeCount(): number {
        const { edgeCount } = this.getNodeAndEdgeCount();
        return edgeCount;
    }

    /**
     * Gets the leaf edges of the graph. A leaf edge is defined as an edge whose start or end node has a degree of 1.
     * Here an edge is defined as a LineString with two coordinates, representing the start and end points.
     * @returns A FeatureCollection<LineString> containing only the leaf edges of the graph.
     */
    getLeafEdges(): FeatureCollection<LineString> {
        return getLeafEdges(this.network).leafEdges;
    }

    /**
     * Returns the pruned network, which is the network without the leaf edges.
     * i.e. This method removes all leaf edges from the network, leaving only the non-leaf edges
     * @return A FeatureCollection<LineString> representing the pruned network without leaf edges.
     */
    getPrunedEdges(depth?: number): FeatureCollection<LineString> {
        if (depth && depth > 0) {

            let currentEdges = this.network;

            for (let i = 0; i < depth; i++) {
                const leafEdges = getLeafEdges(currentEdges);
                currentEdges = leafEdges.nonLeafEdges;
            }

            return currentEdges;

        }
        return getLeafEdges(this.network).nonLeafEdges;
    }
}