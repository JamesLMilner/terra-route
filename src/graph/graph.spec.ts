import { LineStringGraph } from "./graph";
import { FeatureCollection, LineString } from "geojson";
import { readFileSync } from "fs";
import { createLineStringFeature, createFeatureCollection } from "../test-utils/create";
import { BoundingBox } from "./methods/bounding-box";

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

    it('should get network without duplicates or subsections', () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const uniqueNetwork = graph.getNetworkWithoutDuplicatesOrSubsections();
        expect(uniqueNetwork.features.length).toBe(network.features.length);
    });

    it("should return leaf edges and pruned edges", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);
        const leafEdges = graph.getLeafEdges();
        const nonLeafEdges = graph.getPrunedEdges();
        const edgesCount = graph.getEdgeCount();
        expect(leafEdges.features.length).toBe(243);
        expect(nonLeafEdges.features.length).toBe(edgesCount - leafEdges.features.length);
    });

    it("should progressively strips leaf nodes", () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const graph = new LineStringGraph(network);

        const graphAfterFirstPrune = graph.getPrunedEdges(1);
        const graphAfterSecondPrune = graph.getPrunedEdges(2);
        expect(graphAfterSecondPrune.features.length).toBeLessThan(graphAfterFirstPrune.features.length);

        const graphAfterThirdPrune = graph.getPrunedEdges(3);
        expect(graphAfterThirdPrune.features.length).toBeLessThan(graphAfterSecondPrune.features.length);
    });

    describe('getNetworkInBoundingBox', () => {
        it('filters network LineStrings based on bounding box', () => {
            const insideLine = createLineStringFeature([[1, 1], [2, 2]]);
            const outsideLine = createLineStringFeature([[15, 15], [20, 20]]);

            const network = createFeatureCollection([insideLine, outsideLine]);
            const graph = new LineStringGraph(network);

            const boundingBox: BoundingBox = [0, 0, 10, 10];
            const filteredNetwork = graph.getNetworkInBoundingBox(boundingBox);

            expect(filteredNetwork.features).toHaveLength(1);
            expect(filteredNetwork.features[0]).toEqual(insideLine);
        });

        it('returns empty collection when no LineStrings are within bounds', () => {
            const outsideLine1 = createLineStringFeature([[15, 15], [20, 20]]);
            const outsideLine2 = createLineStringFeature([[25, 25], [30, 30]]);

            const network = createFeatureCollection([outsideLine1, outsideLine2]);
            const graph = new LineStringGraph(network);

            const boundingBox: BoundingBox = [0, 0, 10, 10];
            const filteredNetwork = graph.getNetworkInBoundingBox(boundingBox);

            expect(filteredNetwork.features).toHaveLength(0);
        });

        it('does not modify the original network', () => {
            const originalLine = createLineStringFeature([[1, 1], [2, 2]]);
            const network = createFeatureCollection([originalLine]);
            const graph = new LineStringGraph(network);

            const boundingBox: BoundingBox = [0, 0, 10, 10];
            const filteredNetwork = graph.getNetworkInBoundingBox(boundingBox);

            // Original network should remain unchanged
            expect(graph.getNetwork().features).toHaveLength(1);
            expect(filteredNetwork.features).toHaveLength(1);

            // Modifying filtered result shouldn't affect original
            filteredNetwork.features.pop();
            expect(graph.getNetwork().features).toHaveLength(1);
        });
    });

    describe('getUnifiedNetwork', () => {
        it('returns the unified network', () => {
            const insideLine = createLineStringFeature([[1, 1], [2, 2]]);
            const outsideLine = createLineStringFeature([[1.000001, 1.000001], [20, 20]]);

            const network = createFeatureCollection([insideLine, outsideLine]);
            const graph = new LineStringGraph(network);

            const filteredNetwork = graph.getUnifiedNetwork(0.5);

            expect(filteredNetwork.features).toHaveLength(2);
            expect(filteredNetwork.features).toEqual([
                {
                    "geometry": {
                        "coordinates": [[1, 1], [2, 2]],
                        "type": "LineString"
                    },
                    "properties": {},
                    "type": "Feature"
                },
                {
                    "geometry": {
                        "coordinates": [[1, 1], [20, 20]],
                        "type": "LineString"
                    },
                    "properties": {},
                    "type": "Feature"
                }
            ]);
        });
    });

});