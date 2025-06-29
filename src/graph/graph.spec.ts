import { LineStringGraph } from "./graph";
import { FeatureCollection, LineString, Point } from "geojson";
import { readFileSync } from "fs";

describe("LineStringGraph", () => {


    it("should create a graph from a GeoJSON network", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        expect(graph.getNetwork()).toEqual(network);
    });

    it("should return connected components", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const components = graph.getConnectedComponents();
        expect(components.length).toBe(1);
    });

    it("should return the count of connected components", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const count = graph.getConnectedComponentCount();
        expect(count).toBe(1);
    });

    it("should return node and edge counts", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const counts = graph.getNodeAndEdgeCount();
        expect(counts.nodeCount).toBe(2598);
        expect(counts.edgeCount).toBe(2839);
    });

    it("should return nodes as Point features", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const nodes = graph.getNodes();
        expect(nodes.features.length).toBe(2598);
    });

    it("should return the count of unique nodes", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const count = graph.getNodeCount();
        expect(count).toBe(2598);
    });

    it("should return edges as LineString features", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const edges = graph.getEdges();
        expect(edges.features.length).toBe(2839);
    });

    it("should return the count of unique edges", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const count = graph.getEdgeCount();
        expect(count).toBe(2839);
    });

    it("should return the shortest edge between two nodes", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const edge = graph.getShortestEdge();
        expect(edge).toEqual({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [
                        -0.0837395,
                        51.5394794,
                    ],
                    [
                        -0.083739,
                        51.5394744,
                    ],
                ],
            },
            "properties": {},
        })
    })

    it("should return the longest edge between two nodes", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const edge = graph.getLongestEdge();
        expect(edge).toEqual({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [
                        -0.0755711,
                        51.5394099,
                    ],
                    [
                        -0.0753028,
                        51.5423462,
                    ],
                ],
            },
            "properties": {},
        })
    });

    it("should return the length of the longest edge", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const length = graph.getLongestEdgeLength();
        expect(length).toBeCloseTo(0.3270284866264399, 1);
    });

    it("should return the length of the shortest edge", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const length = graph.getShortestEdgeLength();
        expect(length).toBeCloseTo(0.0004570489974749478);
    });

    it("should set the network", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const newNetwork = JSON.parse(readFileSync('src/data/network-5-cc.geojson', 'utf-8')) as FeatureCollection<LineString>;
        graph.setNetwork(newNetwork);
    });
});