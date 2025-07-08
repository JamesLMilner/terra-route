import { FeatureCollection, LineString } from 'geojson';
import { getNetworkInBoundingBox, BoundingBox } from './bounding-box';
import { createFeatureCollection, createLineStringFeature } from '../../test-utils/create';

describe('getNetworkInBoundingBox', () => {
    describe('with an empty feature collection', () => {
        it('returns an empty feature collection', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([]);
            const boundingBox: BoundingBox = [0, 0, 10, 10];
            const output = getNetworkInBoundingBox(input, boundingBox);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: []
            });
        });
    });

    describe('with a single LineString completely within bounds', () => {
        it('returns the LineString', () => {
            const lineString = createLineStringFeature([[1, 1], [2, 2], [3, 3]]);
            const input: FeatureCollection<LineString> = createFeatureCollection([lineString]);
            const boundingBox: BoundingBox = [0, 0, 10, 10];
            const output = getNetworkInBoundingBox(input, boundingBox);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: [lineString]
            });
        });
    });

    describe('with a single LineString partially outside bounds', () => {
        it('excludes the LineString', () => {
            const lineString = createLineStringFeature([[1, 1], [2, 2], [15, 15]]);
            const input: FeatureCollection<LineString> = createFeatureCollection([lineString]);
            const boundingBox: BoundingBox = [0, 0, 10, 10];
            const output = getNetworkInBoundingBox(input, boundingBox);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: []
            });
        });
    });

    describe('with a single LineString completely outside bounds', () => {
        it('excludes the LineString', () => {
            const lineString = createLineStringFeature([[20, 20], [25, 25], [30, 30]]);
            const input: FeatureCollection<LineString> = createFeatureCollection([lineString]);
            const boundingBox: BoundingBox = [0, 0, 10, 10];
            const output = getNetworkInBoundingBox(input, boundingBox);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: []
            });
        });
    });

    describe('with multiple LineStrings', () => {
        it('returns only those completely within bounds', () => {
            const insideLine1 = createLineStringFeature([[1, 1], [2, 2]]);
            const insideLine2 = createLineStringFeature([[5, 5], [6, 6], [7, 7]]);
            const partiallyOutside = createLineStringFeature([[8, 8], [12, 12]]);
            const completelyOutside = createLineStringFeature([[20, 20], [25, 25]]);

            const input: FeatureCollection<LineString> = createFeatureCollection([
                insideLine1,
                insideLine2,
                partiallyOutside,
                completelyOutside
            ]);
            const boundingBox: BoundingBox = [0, 0, 10, 10];
            const output = getNetworkInBoundingBox(input, boundingBox);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: [insideLine1, insideLine2]
            });
        });
    });

    describe('with LineStrings on the boundary', () => {
        it('includes LineStrings with coordinates exactly on the boundary', () => {
            const onBoundary = createLineStringFeature([[0, 0], [10, 10]]);
            const input: FeatureCollection<LineString> = createFeatureCollection([onBoundary]);
            const boundingBox: BoundingBox = [0, 0, 10, 10];
            const output = getNetworkInBoundingBox(input, boundingBox);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: [onBoundary]
            });
        });

        it('excludes LineStrings with any coordinate outside the boundary', () => {
            const slightlyOutside = createLineStringFeature([[0, 0], [10.001, 10]]);
            const input: FeatureCollection<LineString> = createFeatureCollection([slightlyOutside]);
            const boundingBox: BoundingBox = [0, 0, 10, 10];
            const output = getNetworkInBoundingBox(input, boundingBox);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: []
            });
        });
    });

    describe('with negative coordinates', () => {
        it('handles negative bounding box coordinates correctly', () => {
            const lineString = createLineStringFeature([[-5, -5], [-2, -2], [-1, -1]]);
            const input: FeatureCollection<LineString> = createFeatureCollection([lineString]);
            const boundingBox: BoundingBox = [-10, -10, 0, 0];
            const output = getNetworkInBoundingBox(input, boundingBox);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: [lineString]
            });
        });
    });

    describe('with cross-meridian bounding box (longitude crossing 180°)', () => {
        it('handles coordinates correctly when bounding box crosses the antimeridian', () => {
            // Note: This test assumes the simple implementation doesn't handle cross-meridian cases
            // In a real-world scenario, you might need special handling for this
            const lineString = createLineStringFeature([[170, 10], [175, 15]]);
            const input: FeatureCollection<LineString> = createFeatureCollection([lineString]);
            const boundingBox: BoundingBox = [160, 0, 180, 20];
            const output = getNetworkInBoundingBox(input, boundingBox);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: [lineString]
            });
        });
    });

    describe('input validation', () => {
        it('throws an error for invalid bounding box (minLng >= maxLng)', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([]);
            const invalidBoundingBox: BoundingBox = [10, 0, 5, 10]; // minLng > maxLng

            expect(() => {
                getNetworkInBoundingBox(input, invalidBoundingBox);
            }).toThrow('Invalid bounding box: min values must be less than max values');
        });

        it('throws an error for invalid bounding box (minLat >= maxLat)', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([]);
            const invalidBoundingBox: BoundingBox = [0, 10, 10, 5]; // minLat > maxLat

            expect(() => {
                getNetworkInBoundingBox(input, invalidBoundingBox);
            }).toThrow('Invalid bounding box: min values must be less than max values');
        });

        it('throws an error for invalid bounding box (equal min and max)', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([]);
            const invalidBoundingBox: BoundingBox = [0, 0, 0, 0]; // minLng === maxLng

            expect(() => {
                getNetworkInBoundingBox(input, invalidBoundingBox);
            }).toThrow('Invalid bounding box: min values must be less than max values');
        });
    });

    describe('with complex LineStrings', () => {
        it('handles LineStrings with many coordinates', () => {
            const manyCoords = [];
            for (let i = 1; i <= 100; i++) {
                manyCoords.push([i * 0.1, i * 0.1]);
            }
            const complexLineString = createLineStringFeature(manyCoords);
            const input: FeatureCollection<LineString> = createFeatureCollection([complexLineString]);
            const boundingBox: BoundingBox = [0, 0, 20, 20];
            const output = getNetworkInBoundingBox(input, boundingBox);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: [complexLineString]
            });
        });

        it('excludes LineStrings when even one coordinate is outside', () => {
            const coords = [[1, 1], [2, 2], [3, 3], [4, 4], [15, 15]]; // last coordinate outside
            const lineString = createLineStringFeature(coords);
            const input: FeatureCollection<LineString> = createFeatureCollection([lineString]);
            const boundingBox: BoundingBox = [0, 0, 10, 10];
            const output = getNetworkInBoundingBox(input, boundingBox);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: []
            });
        });
    });
});
