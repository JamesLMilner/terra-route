import { FeatureCollection, LineString } from 'geojson';
import { graphGetConnectedComponentCount, graphGetConnectedComponents } from './connected';
import { generateTreeFeatureCollection } from '../../test-utils/generate-network';
import { createFeatureCollection, createLineStringFeature } from '../../test-utils/create';
import { readFileSync, writeFileSync } from 'fs';
import { unifyCloseCoordinates } from './unify';

describe('countConnectedComponents', () => {
    describe('for an empty feature collection', () => {
        it('returns 0', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([]);
            const output = graphGetConnectedComponentCount(input);

            expect(output).toBe(0);
        });
    });

    describe('for feature collection with 1 linestring', () => {
        it('returns 1', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]])
            ]);
            const output = graphGetConnectedComponentCount(input);

            expect(output).toBe(1);
        });
    });

    describe('for feature collection with 2 linestring', () => {
        it('returns 1 if connected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [2, 2]]),

            ]);
            const output = graphGetConnectedComponentCount(input);

            expect(output).toBe(1);
        });

        it('returns 2 if unconnected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[10, 10], [11, 11]]),

            ]);
            const output = graphGetConnectedComponentCount(input);

            expect(output).toBe(2);
        });
    });

    describe('for feature collection with 3 linestring', () => {
        it('returns 1 if connected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [2, 2]]),
                createLineStringFeature([[2, 2], [3, 3]]),

            ]);
            const output = graphGetConnectedComponentCount(input);

            expect(output).toBe(1);
        });

        it('returns 3 if unconnected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[10, 10], [11, 11]]),
                createLineStringFeature([[20, 20], [21, 21]]),
            ]);
            const output = graphGetConnectedComponentCount(input);

            expect(output).toBe(3);
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
            const output = graphGetConnectedComponentCount(input);

            expect(output).toBe(1);
        });

        it('returns 2 when two disconnected groups exist', () => {
            const input = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [2, 2]]),
                createLineStringFeature([[10, 10], [11, 11]]),
                createLineStringFeature([[11, 11], [12, 12]]),
            ]);
            const output = graphGetConnectedComponentCount(input);

            expect(output).toBe(2);
        });


        it('returns 1 for a loop of connected lines', () => {
            const input = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 0]]),
                createLineStringFeature([[1, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [0, 1]]),
                createLineStringFeature([[0, 1], [0, 0]]),
            ]);
            const output = graphGetConnectedComponentCount(input);

            expect(output).toBe(1);
        });
    });

    describe('for complex linestring network', () => {
        it('returns 1 when tree is connected', () => {
            const input = generateTreeFeatureCollection(3, 2)
            const output = graphGetConnectedComponentCount(input)

            expect(output).toBe(1);
        });

        it('returns 1 when it is connected correctly', () => {
            const input = generateTreeFeatureCollection(3, 2)
            const output = graphGetConnectedComponentCount(input)

            expect(output).toBe(1);
        });
    })
});

describe('splitIntoConnectedComponents', () => {
    it('returns empty array for empty feature collection', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([]);
        const output = graphGetConnectedComponents(input);

        expect(output).toEqual([]);
    });

    it('returns single component for single linestring', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            createLineStringFeature([[0, 0], [1, 1]])
        ]);
        const output = graphGetConnectedComponents(input);

        expect(output).toHaveLength(1);
        expect(output[0].features).toHaveLength(1);
    });

    it('returns multiple components for disconnected linestrings', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            createLineStringFeature([[0, 0], [1, 1]]),
            createLineStringFeature([[10, 10], [11, 11]])
        ]);
        const output = graphGetConnectedComponents(input);

        expect(output).toHaveLength(2);
        expect(output[0].features).toHaveLength(1);
        expect(output[1].features).toHaveLength(1);
    });

    it('returns single component for connected linestrings', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            createLineStringFeature([[0, 0], [1, 1]]),
            createLineStringFeature([[1, 1], [2, 2]])
        ]);
        const output = graphGetConnectedComponents(input);

        expect(output).toHaveLength(1);
        expect(output[0].features).toHaveLength(2);
        expect(output[0].features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
        expect(output[0].features[1].geometry.coordinates).toEqual([[1, 1], [2, 2]]);
    });

    it('returns multiple components for selection of connected linestrings', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            createLineStringFeature([[0, 0], [1, 1]]),
            createLineStringFeature([[1, 1], [2, 2]]),
            createLineStringFeature([[10, 10], [11, 11]]),
            createLineStringFeature([[20, 20], [21, 21]])
        ]);
        const output = graphGetConnectedComponents(input);

        expect(output).toHaveLength(3);
        expect(output[0].features).toHaveLength(1);
        expect(output[1].features).toHaveLength(1);
        expect(output[2].features).toHaveLength(2);
    });

    it('returns single component for complex selection of linestrings', () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const output = graphGetConnectedComponents(network);
        expect(output).toHaveLength(1);
        expect(output[0].features).toHaveLength(network.features.length);
    });

    it('returns multiple components for complex selection of linestrings', () => {
        const network = JSON.parse(readFileSync('src/data/network-5-cc.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const output = graphGetConnectedComponents(network);
        expect(output).toHaveLength(5);
        expect(output[4].features > output[0].features).toBeTruthy();
    });

    it('ensures splitIntoConnectedComponents and countConnectedComponents are consistent', () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const components = graphGetConnectedComponents(network);
        const count = graphGetConnectedComponentCount(network);
        expect(components.length).toBe(count);

        const networkMultipleCC = JSON.parse(readFileSync('src/data/network-5-cc.geojson', 'utf-8')) as FeatureCollection<LineString>;
        const componentsMultipleCC = graphGetConnectedComponents(networkMultipleCC);
        const countMultipleCC = graphGetConnectedComponentCount(networkMultipleCC);
        expect(componentsMultipleCC.length).toBe(countMultipleCC);
    });

})