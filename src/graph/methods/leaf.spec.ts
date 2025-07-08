import { FeatureCollection, LineString } from 'geojson';
import { createFeatureCollection } from '../../test-utils/create';
import { getLeafEdges } from './leaf';

describe('getLeafEdges', () => {

    describe('leafEdges', () => {
        describe('for an empty feature collection', () => {
            it('returns 0 nodes and edges', () => {
                const input: FeatureCollection<LineString> = createFeatureCollection([]);
                const output = getLeafEdges(input).leafEdges

                expect(output).toEqual(createFeatureCollection([]));
            });
        });

        describe('for feature collection with 1 linestring', () => {
            it('returns the single linestring as a leaf edge', () => {
                const input: FeatureCollection<LineString> = createFeatureCollection([
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} }
                ]);
                const output = getLeafEdges(input).leafEdges

                expect(output.features.length).toBe(1);
                expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
            });

            it('returns the two linestring as as leaf edge for long linestring', () => {
                const input: FeatureCollection<LineString> = createFeatureCollection([
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }, properties: {} }
                ]);
                const output = getLeafEdges(input).leafEdges

                expect(output.features.length).toBe(2);
                expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
                expect(output.features[1].geometry.coordinates).toEqual([[1, 1], [2, 2]]);
            });
        });

        describe('for feature collection with 2 linestrings', () => {
            it('returns both linestrings if they are unconnected leaf edges', () => {
                const input: FeatureCollection<LineString> = createFeatureCollection([
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[2, 2], [3, 3]] }, properties: {} }
                ]);
                const output = getLeafEdges(input).leafEdges
                expect(output.features.length).toBe(2);
                expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
                expect(output.features[1].geometry.coordinates).toEqual([[2, 2], [3, 3]]);
            });

            it('returns both linestrings if they are connected leaf edges', () => {
                const input: FeatureCollection<LineString> = createFeatureCollection([
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [2, 2]] }, properties: {} }
                ]);
                const output = getLeafEdges(input).leafEdges
                expect(output.features.length).toBe(2);
                expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
                expect(output.features[1].geometry.coordinates).toEqual([[1, 1], [2, 2]]);
            });

            it('returns two linestrings if one is a subsection of the other but they are both leaf edges', () => {
                const input: FeatureCollection<LineString> = createFeatureCollection([
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }, properties: {} }
                ]);
                const output = getLeafEdges(input).leafEdges
                expect(output.features.length).toBe(2);
                expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
                expect(output.features[1].geometry.coordinates).toEqual([[1, 1], [2, 2]]);
            });

            it('handles duplicates', () => {
                const input: FeatureCollection<LineString> = createFeatureCollection([
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} }
                ]);
                const output = getLeafEdges(input).leafEdges
                expect(output.features.length).toBe(1);
            });
        });

        describe('for feature collection with 3 linestrings', () => {
            it('returns 3 leafs when all are disconnected', () => {
                const input: FeatureCollection<LineString> = createFeatureCollection([
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[2, 2], [3, 3]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[4, 4], [5, 5]] }, properties: {} }
                ]);
                const output = getLeafEdges(input).leafEdges
                expect(output.features.length).toBe(3);
            });

            it('returns 3 leafs when all three linestrings are connected by a shared central point', () => {
                const input: FeatureCollection<LineString> = createFeatureCollection([
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [2, 2]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [3, 3]] }, properties: {} }
                ]);
                const output = getLeafEdges(input).leafEdges
                expect(output.features.length).toBe(3);
                expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
                expect(output.features[1].geometry.coordinates).toEqual([[1, 1], [2, 2]]);
                expect(output.features[2].geometry.coordinates).toEqual([[1, 1], [3, 3]]);
            });

            it('returns 3 leafs when two are connected and one is disconnected', () => {
                const input: FeatureCollection<LineString> = createFeatureCollection([
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [2, 2]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[3, 3], [4, 4]] }, properties: {} }
                ]);
                const output = getLeafEdges(input).leafEdges
                expect(output.features.length).toBe(3);
                expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
                expect(output.features[1].geometry.coordinates).toEqual([[1, 1], [2, 2]]);
                expect(output.features[2].geometry.coordinates).toEqual([[3, 3], [4, 4]]);
            });

            it('returns 3 leafs when one linestring is a subsection of another and 3rd is disconnected', () => {
                const input: FeatureCollection<LineString> = createFeatureCollection([
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[3, 3], [4, 4]] }, properties: {} }
                ]);
                const output = getLeafEdges(input).leafEdges
                expect(output.features.length).toBe(3);
            });
        });
    });

    describe('nonLeafEdges', () => {
        it('returns an empty feature collection for empty input', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([]);
            const output = getLeafEdges(input).nonLeafEdges;

            expect(output).toEqual(createFeatureCollection([]));
        });

        it('returns no linestrings for a single input linestring as it would be a leaf edge', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} }
            ]);
            const output = getLeafEdges(input).nonLeafEdges;

            expect(output.features.length).toBe(0);
        });

        it('returns no linestrings for two unconnected linestrings as they would be leaf edges', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[2, 2], [3, 3]] }, properties: {} }
            ]);
            const output = getLeafEdges(input).nonLeafEdges;

            expect(output.features.length).toBe(0);
        });

        it('returns no linestrings for two connected linestrings as they would be leaf edges', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [2, 2]] }, properties: {} }
            ]);
            const output = getLeafEdges(input).nonLeafEdges;

            expect(output.features.length).toBe(0);
        });

        it('returns no linestrings if one is a subsection of the other as they would be leaf edges', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }, properties: {} }
            ]);
            const output = getLeafEdges(input).nonLeafEdges;

            expect(output.features.length).toBe(0);
        });

        it('returns no linestrings for two linestrings that are duplicates', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} }
            ]);
            const output = getLeafEdges(input).nonLeafEdges;

            expect(output.features.length).toBe(0);
        });

        it('returns no linestrings for two linestrings that are inverse duplicates', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [0, 0]] }, properties: {} }
            ]);
            const output = getLeafEdges(input).nonLeafEdges;

            expect(output.features.length).toBe(0);
        });

        it('returns a no linestring for three linestrings where two are connected and one is disconnected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [2, 2]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[3, 3], [4, 4]] }, properties: {} }
            ]);
            const output = getLeafEdges(input).nonLeafEdges;

            expect(output.features.length).toBe(0);
        });

        it('returns a linestring for three linestrings when one is a middle edge and the other two are leaf edges', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [2, 2]] }, properties: {} },
                { type: 'Feature', geometry: { type: 'LineString', coordinates: [[2, 2], [3, 3]] }, properties: {} }
            ]);
            const output = getLeafEdges(input).nonLeafEdges;

            expect(output.features.length).toBe(1);
            expect(output.features[0].geometry.coordinates).toEqual([[1, 1], [2, 2]]);
        });
    })
});

