import { FeatureCollection, LineString } from 'geojson';
import { createFeatureCollection } from '../../test-utils/create';
import { removeDuplicateAndSubsectionLines } from './duplicates';
import { readFileSync } from 'fs';
import { graphGetNodeAndEdgeCount } from './nodes';

describe('removeDuplicateAndSubsectionLines', () => {
    describe('for an empty feature collection', () => {
        it('returns 0', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([]);
            const output = removeDuplicateAndSubsectionLines(input);

            expect(output).toEqual(createFeatureCollection([]));
        });
    });

    describe('for feature collection with 1 linestring', () => {
        it('returns 1', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} }
            ]);
            const output = removeDuplicateAndSubsectionLines(input);

            expect(output.features.length).toBe(1);
            expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
        });
    });

    describe('for feature collection with 2 linestrings', () => {
        it('handles duplicates', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} }
            ]);
            const output = removeDuplicateAndSubsectionLines(input);

            expect(output.features.length).toBe(1);
            expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
        });

        it('returns one linestring if one is a subsection of the other', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }, properties: {} }
            ]);
            const output = removeDuplicateAndSubsectionLines(input);

            expect(output.features.length).toBe(1);
            expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1], [2, 2]]);
        });

        it('returns both if they are not subsections or duplicates', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[2, 2], [3, 3]] }, properties: {} }
            ]);
            const output = removeDuplicateAndSubsectionLines(input);

            expect(output.features.length).toBe(2);
        });

        it('returns one linestring if one is a inverse duplicate of the other', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [0, 0]] }, properties: {} }
            ]);
            const output = removeDuplicateAndSubsectionLines(input);
            expect(output.features.length).toBe(1);
            expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
        });
    });

    describe('for feature collection with 3 linestrings', () => {
        it('returns 1 linestring if all are duplicates', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} }
            ]);
            const output = removeDuplicateAndSubsectionLines(input);
            expect(output.features.length).toBe(1);
            expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
        });

        it('returns 2 linestrings if one is a subsection of another', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[3, 3], [4, 4]] }, properties: {} }
            ]);
            const output = removeDuplicateAndSubsectionLines(input);
            expect(output.features.length).toBe(2);
            expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1], [2, 2]]);
            expect(output.features[1].geometry.coordinates).toEqual([[3, 3], [4, 4]]);
        });

        it('returns all if none are subsections or duplicates', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[2, 2], [3, 3]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[4, 4], [5, 5]] }, properties: {} }
            ]);
            const output = removeDuplicateAndSubsectionLines(input);
            expect(output.features.length).toBe(3);
            expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
            expect(output.features[1].geometry.coordinates).toEqual([[2, 2], [3, 3]]);
            expect(output.features[2].geometry.coordinates).toEqual([[4, 4], [5, 5]]);
        });

        it('returns 1 linestring if one is a subsection of another and the third is a duplicate', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} }
            ]);
            const output = removeDuplicateAndSubsectionLines(input);
            expect(output.features.length).toBe(1);
            expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1], [2, 2]]);
        });

        it('returns 1 linestring if one is a subsection of another and the third is an inverse duplicate', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [0, 0]] }, properties: {} }
            ]);
            const output = removeDuplicateAndSubsectionLines(input);
            expect(output.features.length).toBe(1);
            expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1], [2, 2]]);
        });
    });

    describe('for feature collection with multiple linestrings', () => {
        it('handles multiple duplicates and subsections', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[3, 3], [4, 4]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[3, 3], [4, 4], [5, 5]] }, properties: {} }
            ]);
            const output = removeDuplicateAndSubsectionLines(input);

            expect(output.features.length).toBe(2);
            expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1], [2, 2]]);
            expect(output.features[1].geometry.coordinates).toEqual([[3, 3], [4, 4], [5, 5]]);
        });

        it('ensures it does not effect the network in a complex scenario', () => {
            const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;

            expect(network.features.length).toBe(811);

            const after = removeDuplicateAndSubsectionLines(network);

            // There are no duplicates or subsections in the network
            expect(after.features.length).toBe(811);

            expect(graphGetNodeAndEdgeCount(removeDuplicateAndSubsectionLines(after))).toEqual(graphGetNodeAndEdgeCount(network))
        });
    })
});
