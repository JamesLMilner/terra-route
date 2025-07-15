import { FeatureCollection, LineString } from 'geojson';
import { unifyCloseCoordinates } from './unify';
import { getReasonIfLineStringInvalid } from '../../test-utils/utils';
import { graphGetConnectedComponentCount } from './connected';
import { graphGetNodeAndEdgeCount } from './nodes';
import { createFeatureCollection, createLineStringFeature } from '../../test-utils/create';

describe('unifyCloseCoordinates', () => {
    describe('for an empty feature collection', () => {
        it('returns an empty feature collection', () => {
            const input: FeatureCollection<LineString> = {
                type: 'FeatureCollection',
                features: []
            };
            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(output).toEqual({
                type: 'FeatureCollection',
                features: []
            });
        });
    });

    describe('for a single linestring', () => {
        it('does not modify coordinates', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [0.00001, 0.00001], // ~1.5m apart
                    [0.00002, 0.00002] // ~1.5m apart
                ]),
            ]);

            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);
            const coords = output.features[0].geometry.coordinates;

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();

            expect(coords).toHaveLength(3); // Should unify to a single coordinate
            expect(coords[0]).toEqual([0, 0]); // Both coordinates should unify to the first one
            expect(coords[1]).toEqual([0.00001, 0.00001]); // Both coordinates should unify to the first one
            expect(coords[2]).toEqual([0.00002, 0.00002]); // Both coordinates should unify to the first one

            expect(graphGetConnectedComponentCount(output)).toBe(1);
            expect(graphGetNodeAndEdgeCount(output)).toEqual({ nodeCount: 3, edgeCount: 2 });
        });
    });

    describe('for two linestrings', () => {
        it('does nothing if linestrings are already connected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [0.00001, 0.00001] // ~1.5m apart
                ]),
                createLineStringFeature([
                    [0.00001, 0.00001],
                    [0.00002, 0.00002] // ~1.5m apart
                ]),
            ]);

            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();
            const coords = output.features[0].geometry.coordinates;
            expect(coords).toHaveLength(2);
            expect(coords[0]).toEqual([0, 0]);
            expect(coords[1]).toEqual([0.00001, 0.00001]);

            expect(getReasonIfLineStringInvalid(output.features[1])).toBeUndefined();
            const coordsTwo = output.features[1].geometry.coordinates;
            expect(coordsTwo).toHaveLength(2);
            expect(coordsTwo[0]).toEqual([0.00001, 0.00001]);
            expect(coordsTwo[1]).toEqual([0.00002, 0.00002]);

            expect(graphGetConnectedComponentCount(output)).toBe(1);
            expect(graphGetNodeAndEdgeCount(output)).toEqual({ nodeCount: 3, edgeCount: 2 });
        });

        it('unifies two nearby linestring coordinates if they are within tolerance', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [0.00001, 0.00001] // ~1.5m apart
                ]),
                createLineStringFeature([
                    [0.00002, 0.00002],
                    [0.00003, 0.00003] // ~1.5m apart
                ]),
            ]);

            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();
            const coords = output.features[0].geometry.coordinates;
            expect(coords).toHaveLength(2);
            expect(coords[0]).toEqual([0, 0]);
            expect(coords[1]).toEqual([0.00001, 0.00001]);

            expect(getReasonIfLineStringInvalid(output.features[1])).toBeUndefined();
            const coordsTwo = output.features[1].geometry.coordinates;
            expect(coordsTwo).toHaveLength(2);
            expect(coordsTwo[0]).toEqual([0.00001, 0.00001]);
            expect(coordsTwo[1]).toEqual([0.00003, 0.00003]);

            expect(graphGetConnectedComponentCount(output)).toBe(1);
            expect(graphGetNodeAndEdgeCount(output)).toEqual({ nodeCount: 3, edgeCount: 2 });
        });

        it('does not unify coordinates if they are not within tolerance', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 1]
                ]),
                createLineStringFeature([
                    [10, 10],
                    [11, 11]
                ]),
            ]);

            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();
            const coords = output.features[0].geometry.coordinates;
            expect(coords).toHaveLength(2);
            expect(coords[0]).toEqual([0, 0]);
            expect(coords[1]).toEqual([1, 1]);

            expect(getReasonIfLineStringInvalid(output.features[1])).toBeUndefined();
            const coordsTwo = output.features[1].geometry.coordinates;
            expect(coordsTwo).toHaveLength(2);
            expect(coordsTwo[0]).toEqual([10, 10]);
            expect(coordsTwo[1]).toEqual([11, 11]);

            expect(graphGetConnectedComponentCount(output)).toBe(2);
            expect(graphGetNodeAndEdgeCount(output)).toEqual({ nodeCount: 4, edgeCount: 2 });
        });

        it('does unify both coordinates to corresponding coordinates in counterpart linestring if they are within tolerance', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 1]
                ]),
                createLineStringFeature([
                    [0.000001, 0.000001],
                    [1.000001, 1.000001]
                ]),
            ]);

            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();
            const coords = output.features[0].geometry.coordinates;
            expect(coords).toHaveLength(2);
            expect(coords[0]).toEqual([0, 0]);
            expect(coords[1]).toEqual([1, 1]);

            expect(getReasonIfLineStringInvalid(output.features[1])).toBeUndefined();
            const coordsTwo = output.features[1].geometry.coordinates;
            expect(coordsTwo).toHaveLength(2);
            expect(coordsTwo[0]).toEqual([0, 0]);
            expect(coordsTwo[1]).toEqual([1, 1]);

            // Only one because lines are now identical and connected
            expect(graphGetConnectedComponentCount(output)).toBe(1);
            expect(graphGetNodeAndEdgeCount(output)).toEqual({ nodeCount: 2, edgeCount: 1 });
        });
    });

    describe('for multiple linestrings', () => {
        it('does nothing if linestrings already connected', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [0.00001, 0.00001] // ~1.5m apart
                ]),
                createLineStringFeature([
                    [0.00001, 0.00001],
                    [0.00002, 0.00002] // ~1.5m apart
                ]),
                createLineStringFeature([
                    [0.00002, 0.00002],
                    [0.00003, 0.00003] // ~1.5m apart
                ]),
            ]);

            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();
            const coords = output.features[0].geometry.coordinates;
            expect(coords).toHaveLength(2);
            expect(coords[0]).toEqual([0, 0]);
            expect(coords[1]).toEqual([0.00001, 0.00001]);

            expect(getReasonIfLineStringInvalid(output.features[1])).toBeUndefined();
            const coordsTwo = output.features[1].geometry.coordinates;
            expect(coordsTwo).toHaveLength(2);
            expect(coordsTwo[0]).toEqual([0.00001, 0.00001]);
            expect(coordsTwo[1]).toEqual([0.00002, 0.00002]);

            expect(getReasonIfLineStringInvalid(output.features[2])).toBeUndefined();
            const coordsThree = output.features[2].geometry.coordinates;
            expect(coordsThree).toHaveLength(2);
            expect(coordsThree[0]).toEqual([0.00002, 0.00002]);
            expect(coordsThree[1]).toEqual([0.00003, 0.00003]);

            expect(graphGetConnectedComponentCount(output)).toBe(1);
            expect(graphGetNodeAndEdgeCount(output)).toEqual({ nodeCount: 4, edgeCount: 3 });
        });

        it('does not unify any linestrings coordinates if they are not within tolerance', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [0.00001, 0.00001] // ~1.5m apart
                ]),
                createLineStringFeature([
                    [0.00002, 0.00002],
                    [0.00003, 0.00003] // ~1.5m apart
                ]),
                createLineStringFeature([
                    [0.00004, 0.00004],
                    [0.00005, 0.00005] // ~1.5m apart
                ]),
            ]);

            // Note the reduced radiusMeters
            const radiusMeters = 1; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();
            const coords = output.features[0].geometry.coordinates;
            expect(coords).toHaveLength(2);
            expect(coords[0]).toEqual([0, 0]);
            expect(coords[1]).toEqual([0.00001, 0.00001]);

            expect(getReasonIfLineStringInvalid(output.features[1])).toBeUndefined();
            const coordsTwo = output.features[1].geometry.coordinates;
            expect(coordsTwo).toHaveLength(2);
            expect(coordsTwo[0]).toEqual([0.00002, 0.00002]);
            expect(coordsTwo[1]).toEqual([0.00003, 0.00003]);

            expect(getReasonIfLineStringInvalid(output.features[2])).toBeUndefined();
            const coordsThree = output.features[2].geometry.coordinates;
            expect(coordsThree).toHaveLength(2);
            expect(coordsThree[0]).toEqual([0.00004, 0.00004]);
            expect(coordsThree[1]).toEqual([0.00005, 0.00005]);

            expect(graphGetConnectedComponentCount(output)).toBe(3);
            expect(graphGetNodeAndEdgeCount(output)).toEqual({ nodeCount: 6, edgeCount: 3 });
        });

        it('unifies linestrings coordinates where they are within tolerance', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [0.00001, 0.00001] // ~1.5m apart
                ]),
                createLineStringFeature([
                    [0.00002, 0.00002],
                    [0.00003, 0.00003] // ~1.5m apart
                ]),
                createLineStringFeature([
                    [0.00004, 0.00004],
                    [0.00005, 0.00005] // ~1.5m apart
                ]),
            ]);

            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();
            const coords = output.features[0].geometry.coordinates;
            expect(coords).toHaveLength(2);
            expect(coords[0]).toEqual([0, 0]);
            expect(coords[1]).toEqual([0.00001, 0.00001]);

            expect(getReasonIfLineStringInvalid(output.features[1])).toBeUndefined();
            const coordsTwo = output.features[1].geometry.coordinates;
            expect(coordsTwo).toHaveLength(2);
            expect(coordsTwo[0]).toEqual([0.00001, 0.00001]);
            expect(coordsTwo[1]).toEqual([0.00003, 0.00003]);

            expect(getReasonIfLineStringInvalid(output.features[2])).toBeUndefined();
            const coordsThree = output.features[2].geometry.coordinates;
            expect(coordsThree).toHaveLength(2);
            expect(coordsThree[0]).toEqual([0.00003, 0.00003]);
            expect(coordsThree[1]).toEqual([0.00005, 0.00005]);

            expect(graphGetConnectedComponentCount(output)).toBe(1);
            expect(graphGetNodeAndEdgeCount(output)).toEqual({ nodeCount: 4, edgeCount: 3 });

        });

        it('unifies closest coordinate of linestrings if they are within tolerance and there are multiple options', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [0.00001, 0.00001]
                ]),
                createLineStringFeature([
                    [0.000011, 0.000011],
                    [0.00003, 0.00003]
                ]),
                createLineStringFeature([
                    [0.000012, 0.000012],
                    [0.00005, 0.00005]
                ]),
            ]);

            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();
            const coords = output.features[0].geometry.coordinates;
            expect(coords).toHaveLength(2);
            expect(coords[0]).toEqual([0, 0]);
            expect(coords[1]).toEqual([0.00001, 0.00001]);

            expect(getReasonIfLineStringInvalid(output.features[1])).toBeUndefined();
            const coordsTwo = output.features[1].geometry.coordinates;
            expect(coordsTwo).toHaveLength(2);
            expect(coordsTwo[0]).toEqual([0.00001, 0.00001]);
            expect(coordsTwo[1]).toEqual([0.00003, 0.00003]);

            expect(getReasonIfLineStringInvalid(output.features[2])).toBeUndefined();
            const coordsThree = output.features[2].geometry.coordinates;
            expect(coordsThree).toHaveLength(2);
            expect(coordsThree[0]).toEqual([0.00001, 0.00001]);
            expect(coordsThree[1]).toEqual([0.00005, 0.00005]);

            expect(graphGetConnectedComponentCount(output)).toBe(1);
        });

        it('unifies first coordinate where they are within tolerance', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [0.00001, 0.00001]
                ]),
                // Going off in a different direction
                createLineStringFeature([
                    [0.000001, 0.000001],
                    [-0.00001, -0.00001]
                ]),
                createLineStringFeature([
                    [0.0000011, 0.0000011],
                    [-0.00003, -0.00003]
                ]),
            ]);

            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();
            const coords = output.features[0].geometry.coordinates;
            expect(coords).toHaveLength(2);
            expect(coords[0]).toEqual([0, 0]);
            expect(coords[1]).toEqual([0.00001, 0.00001]);

            expect(getReasonIfLineStringInvalid(output.features[1])).toBeUndefined();
            const coordsTwo = output.features[1].geometry.coordinates;
            expect(coordsTwo).toHaveLength(2);
            expect(coordsTwo[0]).toEqual([0, 0]);
            expect(coordsTwo[1]).toEqual([-0.00001, -0.00001]);

            expect(getReasonIfLineStringInvalid(output.features[2])).toBeUndefined();
            const coordsThree = output.features[2].geometry.coordinates;
            expect(coordsThree).toHaveLength(2);
            expect(coordsThree[0]).toEqual([0, 0]);
            expect(coordsThree[1]).toEqual([-0.00003, -0.00003]);

            expect(graphGetConnectedComponentCount(output)).toBe(1);
        });

        it('unifies last coordinate where they are within tolerance', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [-3, -3],
                    [0, 0]
                ]),
                createLineStringFeature([
                    [-1, -1],
                    [0.000001, 0.000001]
                ]),
                createLineStringFeature([
                    [-2, -2],
                    [0.0000011, 0.0000011]
                ]),
            ]);

            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();
            const coords = output.features[0].geometry.coordinates;
            expect(coords).toHaveLength(2);
            expect(coords[0]).toEqual([-3, -3]);
            expect(coords[1]).toEqual([0, 0]);


            expect(getReasonIfLineStringInvalid(output.features[1])).toBeUndefined();
            const coordsTwo = output.features[1].geometry.coordinates;
            expect(coordsTwo).toHaveLength(2);

            expect(coordsTwo[0]).toEqual([-1, -1]);
            expect(coordsTwo[1]).toEqual([0, 0]);


            expect(getReasonIfLineStringInvalid(output.features[2])).toBeUndefined();
            const coordsThree = output.features[2].geometry.coordinates;
            expect(coordsThree).toHaveLength(2);
            expect(coordsThree[0]).toEqual([-2, -2]);
            expect(coordsThree[1]).toEqual([0, 0]);


            expect(graphGetConnectedComponentCount(output)).toBe(1);
        });

        it('unifies middle coordinate where they are within tolerance', () => {
            const input: FeatureCollection<LineString> = createFeatureCollection([
                createLineStringFeature([
                    [-1, -1],
                    [0, 0],
                    [1, 1]
                ]),
                createLineStringFeature([
                    [-2, -2],
                    [0.000001, 0.000001],
                    [2, 2]
                ]),
                createLineStringFeature([
                    [-3, -3],
                    [0.0000011, 0.0000011],
                    [3, 3]
                ]),
            ]);

            const radiusMeters = 2; // meters
            const output = unifyCloseCoordinates(input, radiusMeters);

            expect(getReasonIfLineStringInvalid(output.features[0])).toBeUndefined();
            const coords = output.features[0].geometry.coordinates;
            expect(coords).toHaveLength(3);
            expect(coords[0]).toEqual([-1, -1]);
            expect(coords[1]).toEqual([0, 0]);
            expect(coords[2]).toEqual([1, 1]);

            expect(getReasonIfLineStringInvalid(output.features[1])).toBeUndefined();
            const coordsTwo = output.features[1].geometry.coordinates;
            expect(coordsTwo).toHaveLength(3);
            expect(coordsTwo[0]).toEqual([-2, -2]);
            expect(coordsTwo[1]).toEqual([0, 0]);
            expect(coordsTwo[2]).toEqual([2, 2]);

            expect(getReasonIfLineStringInvalid(output.features[2])).toBeUndefined();
            const coordsThree = output.features[2].geometry.coordinates;
            expect(coordsThree).toHaveLength(3);
            expect(coordsThree[0]).toEqual([-3, -3]);
            expect(coordsThree[1]).toEqual([0, 0]);
            expect(coordsThree[2]).toEqual([3, 3]);

            expect(graphGetConnectedComponentCount(output)).toBe(1);
        });
    });
});
