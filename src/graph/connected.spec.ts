import { FeatureCollection, LineString } from 'geojson';
import { countConnectedComponents } from './connected';
import { generateTreeFeatureCollection } from '../test-utils/generate-network';
import { createFeatureCollection, createLineStringFeature } from '../test-utils/create';

describe('countConnectedComponents', () => {
    describe('for an empty feature collection', () => {
        it('returns 0', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([]);
            const output = countConnectedComponents(input);

            expect(output).toBe(0);
        });
    });

    describe('for feature collection with 1 linestring', () => {
        it('returns 1', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]])
            ]);
            const output = countConnectedComponents(input);

            expect(output).toBe(1);
        });
    });

    describe('for feature collection with 2 linestring', () => {
        it('returns 1 if connected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [2, 2]]),

            ]);
            const output = countConnectedComponents(input);

            expect(output).toBe(1);
        });

        it('returns 2 if unconnected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[10, 10], [11, 11]]),

            ]);
            const output = countConnectedComponents(input);

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
            const output = countConnectedComponents(input);

            expect(output).toBe(1);
        });

        it('returns 3 if unconnected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[10, 10], [11, 11]]),
                createLineStringFeature([[20, 20], [21, 21]]),
            ]);
            const output = countConnectedComponents(input);

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
            const output = countConnectedComponents(input);

            expect(output).toBe(1);
        });

        it('returns 2 when two disconnected groups exist', () => {
            const input = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [2, 2]]),
                createLineStringFeature([[10, 10], [11, 11]]),
                createLineStringFeature([[11, 11], [12, 12]]),
            ]);
            const output = countConnectedComponents(input);

            expect(output).toBe(2);
        });


        it('returns 1 for a loop of connected lines', () => {
            const input = createFeatureCollection([
                createLineStringFeature([[0, 0], [1, 0]]),
                createLineStringFeature([[1, 0], [1, 1]]),
                createLineStringFeature([[1, 1], [0, 1]]),
                createLineStringFeature([[0, 1], [0, 0]]),
            ]);
            const output = countConnectedComponents(input);

            expect(output).toBe(1);
        });
    });

    describe('for complex linestring network', () => {
        it('returns 1 when tree is connected', () => {
            const input = generateTreeFeatureCollection(3, 2)
            const output = countConnectedComponents(input)

            expect(output).toBe(1);
        });

        it('returns 1 when it is connected correctly', () => {
            const input = generateTreeFeatureCollection(3, 2)
            const output = countConnectedComponents(input)

            expect(output).toBe(1);
        });
    })
});
