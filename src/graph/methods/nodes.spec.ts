import { FeatureCollection, LineString } from 'geojson';
import { graphGetNodesAsPoints, graphGetNodeAndEdgeCount } from './nodes';
import { createFeatureCollection, createLineStringFeature } from '../../test-utils/create';

describe('graphGetNodeAndEdgeCount', () => {
    describe('for an empty feature collection', () => {
        it('returns 0 nodes and edges', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([]);
            const output = graphGetNodeAndEdgeCount(input);

            expect(output).toEqual({
                nodeCount: 0,
                edgeCount: 0
            });
        });
    });

    describe('for feature collection with 1 linestring', () => {
        it('returns 1', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]])
            ]);
            const output = graphGetNodeAndEdgeCount(input);

            expect(output).toEqual({
                nodeCount: 2,
                edgeCount: 1
            });
        });
    });

    describe('for feature collection with 2 linestring', () => {
        it('returns 3 nodes and 2 edges if line is connected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [2, 2]]),

            ]);
            const output = graphGetNodeAndEdgeCount(input);

            expect(output).toEqual({
                nodeCount: 3,
                edgeCount: 2
            });
        });

        it('returns 4 nodes and 2 if unconnected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[10, 10], [11, 11]]),

            ]);
            const output = graphGetNodeAndEdgeCount(input);

            expect(output).toEqual({
                nodeCount: 4,
                edgeCount: 2
            });
        });
    });

    describe('for feature collection with 3 linestring', () => {
        it('returns 1 if connected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [2, 2]]),
                createLineStringFeature([[2, 2], [3, 3]]),

            ]);
            const output = graphGetNodeAndEdgeCount(input);

            expect(output).toEqual({
                nodeCount: 4,
                edgeCount: 3
            });
        });

        it('returns 3 if unconnected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[10, 10], [11, 11]]),
                createLineStringFeature([[20, 20], [21, 21]]),
            ]);
            const output = graphGetNodeAndEdgeCount(input);

            expect(output).toEqual({
                nodeCount: 6,
                edgeCount: 3
            });
        });
    });


    describe('for feature collection with multiple linestring', () => {
        it('returns 1 when all lines share the same coordinate', () => {
            const input = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [2, 2]]),
                createLineStringFeature([[1, 1], [3, 3]]),
                createLineStringFeature([[4, 4], [1, 1]]),
            ]);
            const output = graphGetNodeAndEdgeCount(input);

            expect(output).toEqual({
                nodeCount: 5,
                edgeCount: 4
            });
        });

        it('returns 2 when two disconnected groups exist', () => {
            const input = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [2, 2]]),
                createLineStringFeature([[10, 10], [11, 11]]),
                createLineStringFeature([[11, 11], [12, 12]]),
            ]);
            const output = graphGetNodeAndEdgeCount(input);

            expect(output).toEqual({
                nodeCount: 6,
                edgeCount: 4
            });
        });


        it('returns 1 for a loop of connected lines', () => {
            const input = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 0]]),
                createLineStringFeature([[1, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [0, 1]]),
                createLineStringFeature([[0, 1], [0, 0]]),
            ]);
            const output = graphGetNodeAndEdgeCount(input);

            expect(output).toEqual({
                nodeCount: 4,
                edgeCount: 4
            });
        });
    });
});

describe('graphGetNodesAsPoints', () => {
    it('returns an empty array for an empty feature collection', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([]);
        const output = graphGetNodesAsPoints(input);

        expect(output).toEqual([]);
    });

    it('returns points for a single linestring', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            createLineStringFeature([[0, 0], [1, 1]])
        ]);
        const output = graphGetNodesAsPoints(input);

        expect(output).toEqual([
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0]
                },
                properties: {}
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [1, 1]
                },
                properties: {}
            }
        ]);
    });

    it('returns points for multiple linestrings with unique coordinates', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            createLineStringFeature([[0, 0], [1, 1]]),
            createLineStringFeature([[1, 1], [2, 2]]),
            createLineStringFeature([[3, 3], [4, 4]])
        ]);
        const output = graphGetNodesAsPoints(input);

        expect(output).toEqual([
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0]
                },
                properties: {}
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [1, 1]
                },
                properties: {}
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [2, 2]
                },
                properties: {}
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [3, 3]
                },
                properties: {}
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [4, 4]
                },
                properties: {}
            }
        ]);
    });

    it('returns points for multiple linestrings with shared coordinates', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            createLineStringFeature([[0, 0], [1, 1]]),
            createLineStringFeature([[1, 1], [2, 2]]),
            createLineStringFeature([[1, 1], [3, 3]])
        ]);
        const output = graphGetNodesAsPoints(input);

        expect(output).toEqual([
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0]
                },
                properties: {}
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [1, 1]
                },
                properties: {}
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [2, 2]
                },
                properties: {}
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [3, 3]
                },
                properties: {}
            }
        ]);
    });

    it('returns points for a loop of connected lines', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            createLineStringFeature([[0, 0], [1, 0]]),
            createLineStringFeature([[1, 0], [1, 1]]),
            createLineStringFeature([[1, 1], [0, 1]]),
            createLineStringFeature([[0, 1], [0, 0]]),
        ]);
        const output = graphGetNodesAsPoints(input);

        expect(output).toEqual([
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0]
                },
                properties: {}
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [1, 0]
                },
                properties: {}
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [1, 1]
                },
                properties: {}
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 1]
                },
                properties: {}
            }
        ]);
    });
})