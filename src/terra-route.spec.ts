import { createCheapRuler } from "./distance/cheap-ruler";
import { TerraRoute } from "./terra-route";
import { createFeatureCollection, createLineStringFeature, createPointFeature, generateConcentricRings, generateGridWithDiagonals, generateStarPolygon, generateTreeFeatureCollection, getReasonIfLineStringInvalid, getUniqueCoordinatesFromLineStrings, routeIsLongerThanDirectPath, startAndEndAreCorrect } from "./test-utils/test-utils";

describe("TerraRoute", () => {
    let routeFinder: TerraRoute;

    beforeEach(() => {
        routeFinder = new TerraRoute();
    })

    describe('constructor', () => {
        it('initializes with default distance measurement', () => {
            const routeFinder = new TerraRoute();
            expect(routeFinder).toBeDefined();
        });

        it('initializes with custom distance measurement', () => {
            const customDistance = (a: number[], b: number[]) => Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
            const routeFinder = new TerraRoute(customDistance);
            expect(routeFinder).toBeDefined();
        });
    });

    describe('buildRouteGraph', () => {
        it("builds the route graph from a simple network", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 1],
                ]),
                createLineStringFeature([
                    [1, 1],
                    [2, 2],
                ]),
            ]);

            routeFinder.buildRouteGraph(network);
        });
    })

    describe('getRoute', () => {
        it('throws an error if the network is not built', () => {
            const start = createPointFeature([0, 0]);
            const end = createPointFeature([1, 1]);

            expect(() => routeFinder.getRoute(start, end)).toThrow("Network not built. Please call buildRouteGraph(network) first.");
        })

        it("finds the correct shortest route in a simple connected graph", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 0],
                    [2, 0],
                ]),
                createLineStringFeature([
                    [2, 0],
                    [2, 1],
                ]),
            ]);

            routeFinder.buildRouteGraph(network);

            const start = createPointFeature([0, 0]);
            const end = createPointFeature([2, 1]);

            const result = routeFinder.getRoute(start, end);

            expect(result).not.toBeNull();
            expect(result!.geometry.coordinates).toEqual([
                [0, 0],
                [1, 0],
                [2, 0],
                [2, 1],
            ]);
        });

        it("finds the correct shortest route in a simple connected graph with CheapRuler", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 0],
                    [2, 0],
                ]),
                createLineStringFeature([
                    [2, 0],
                    [2, 1],
                ]),
            ]);

            const distance = createCheapRuler(0)

            routeFinder = new TerraRoute(distance);
            routeFinder.buildRouteGraph(network);

            const start = createPointFeature([0, 0]);
            const end = createPointFeature([2, 1]);

            const result = routeFinder.getRoute(start, end);

            expect(result).not.toBeNull();
            expect(result!.geometry.coordinates).toEqual([
                [0, 0],
                [1, 0],
                [2, 0],
                [2, 1],
            ]);
        });

        it("selects one of the valid shortest paths if multiple exist", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 0],
                    [2, 0],
                ]),
                createLineStringFeature([
                    [0, 0],
                    [0, 1],
                    [2, 0],
                ]),
            ]);

            const routeFinder = new TerraRoute();
            routeFinder.buildRouteGraph(network);
            const start = createPointFeature([0, 0]);
            const end = createPointFeature([2, 0]);

            const result = routeFinder.getRoute(start, end);

            expect(result).not.toBeNull();
            expect(result!.geometry.coordinates[0]).toEqual([0, 0]);
            expect(result!.geometry.coordinates.at(-1)).toEqual([2, 0]);
            expect(result!.geometry.coordinates.length).toBeGreaterThanOrEqual(2);
        });

        it("can route across intersecting segments", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 1],
                ]),
                createLineStringFeature([
                    [1, 1],
                    [2, 0],
                ]),
            ]);

            const routeFinder = new TerraRoute();
            routeFinder.buildRouteGraph(network);
            const start = createPointFeature([0, 0]);
            const end = createPointFeature([2, 0]);

            const result = routeFinder.getRoute(start, end);

            expect(result).not.toBeNull();
            expect(result!.geometry.coordinates).toEqual([
                [0, 0],
                [1, 1],
                [2, 0],
            ]);
        });

        it("routes correctly when segments are defined in reverse order", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [1, 0],
                    [0, 0],
                ]),
                createLineStringFeature([
                    [2, 0],
                    [1, 0],
                ]),
            ]);

            const routeFinder = new TerraRoute();
            routeFinder.buildRouteGraph(network);
            const start = createPointFeature([0, 0]);
            const end = createPointFeature([2, 0]);

            const result = routeFinder.getRoute(start, end);

            expect(result).not.toBeNull();
            expect(result!.geometry.coordinates).toEqual([
                [0, 0],
                [1, 0],
                [2, 0],
            ]);
        });

        it("handles branching correctly and chooses the shortest path", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 0],
                ]),
                createLineStringFeature([
                    [1, 0],
                    [2, 0],
                ]),
                createLineStringFeature([
                    [1, 0],
                    [1, 1],
                    [2, 1],
                ]),
            ]);

            const routeFinder = new TerraRoute();
            routeFinder.buildRouteGraph(network);
            const start = createPointFeature([0, 0]);
            const end = createPointFeature([2, 0]);

            const result = routeFinder.getRoute(start, end);

            expect(result).not.toBeNull();
            expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
            expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
            expect(result!.geometry.coordinates).toEqual([
                [0, 0],
                [1, 0],
                [2, 0],
            ]);
        });

        it("ignores duplicate coordinates within a segment", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 0],
                    [1, 0],
                    [2, 0],
                ]),
            ]);

            const routeFinder = new TerraRoute();
            routeFinder.buildRouteGraph(network);
            const start = createPointFeature([0, 0]);
            const end = createPointFeature([2, 0]);

            const result = routeFinder.getRoute(start, end);

            expect(result).not.toBeNull();
            expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
            expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
            expect(result!.geometry.coordinates[0]).toEqual([0, 0]);
            expect(result!.geometry.coordinates.at(-1)).toEqual([2, 0]);
        });

        describe('returns null if', () => {
            it("start and end are the same", () => {
                const network = createFeatureCollection([
                    createLineStringFeature([
                        [0, 0],
                        [1, 1],
                    ]),
                ]);

                const routeFinder = new TerraRoute();
                routeFinder.buildRouteGraph(network);
                const start = createPointFeature([0, 0]);

                const result = routeFinder.getRoute(start, start);

                expect(result).toBeNull();
            });

            it("the network is empty", () => {
                const network = createFeatureCollection([]);

                const routeFinder = new TerraRoute();
                routeFinder.buildRouteGraph(network);
                const start = createPointFeature([0, 0]);
                const end = createPointFeature([1, 1]);

                const result = routeFinder.getRoute(start, end);

                expect(result).toBeNull();
            });

            it("no path exists between start and end", () => {
                const network = createFeatureCollection([
                    createLineStringFeature([
                        [0, 0],
                        [1, 0],
                    ]),
                    createLineStringFeature([
                        [5, 5],
                        [6, 5],
                    ]),
                ]);

                const routeFinder = new TerraRoute();
                routeFinder.buildRouteGraph(network);

                const start = createPointFeature([0, 0]);
                const end = createPointFeature([6, 5]);

                const result = routeFinder.getRoute(start, end);

                expect(result).toBeNull();
            });

            it("start and end are not on any segment", () => {
                const network = createFeatureCollection([
                    createLineStringFeature([
                        [0, 0],
                        [1, 0],
                        [2, 0],
                    ]),
                ]);

                const routeFinder = new TerraRoute();
                routeFinder.buildRouteGraph(network);
                const start = createPointFeature([10, 10]);
                const end = createPointFeature([20, 20]);

                const result = routeFinder.getRoute(start, end);

                expect(result).toBeNull();
            });

            it("start or end are not on any segment", () => {
                const network = createFeatureCollection([
                    createLineStringFeature([
                        [0, 0],
                        [1, 0],
                        [2, 0],
                    ]),
                ]);

                const routeFinder = new TerraRoute();
                routeFinder.buildRouteGraph(network);
                const start = createPointFeature([10, 10]);
                const end = createPointFeature([2, 0]);

                const result = routeFinder.getRoute(start, end);

                expect(result).toBeNull();
            });
        })

        describe('can find shortest path on graph of type', () => {

            describe('grid', () => {
                it("of dimensions 3x3", () => {
                    const network = generateGridWithDiagonals(3, 0.01)

                    const routeFinder = new TerraRoute();
                    routeFinder.buildRouteGraph(network);
                    const start = createPointFeature([0.00, 0.00]);
                    const end = createPointFeature([0.02, 0.02]);

                    const result = routeFinder.getRoute(start, end);

                    expect(result).not.toBeNull();

                    // Should take diagonals: (0,0) → (0.01,0.01) → (0.02,0.02)
                    const expectedRoute = [
                        [0.00, 0.00],
                        [0.01, 0.01],
                        [0.02, 0.02],
                    ];
                    expect(result!.geometry.coordinates).toEqual(expectedRoute);

                    const resultTwo = routeFinder.getRoute(end, start);
                    expect(resultTwo).not.toBeNull();
                    expect(routeIsLongerThanDirectPath(result!, start, end)).toBe(true);
                    expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
                    expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
                    expect(resultTwo!.geometry.coordinates).toEqual(expectedRoute.reverse());
                });

                it("of dimensions 10x10", () => {
                    const network = generateGridWithDiagonals(10, 0.01)

                    const routeFinder = new TerraRoute();
                    routeFinder.buildRouteGraph(network);
                    const start = createPointFeature([0.00, 0.00]);
                    const end = createPointFeature([0.05, 0.05]);

                    const result = routeFinder.getRoute(start, end);

                    expect(result).not.toBeNull();
                    expect(getReasonIfLineStringInvalid(result)).toBe(undefined);

                    // Should take diagonals: (0,0) → (0.01,0.01) → (0.05,0.05)
                    const expectedRoute = [
                        [0.00, 0.00],
                        [0.01, 0.01],
                        [0.02, 0.02],
                        [0.03, 0.03],
                        [0.04, 0.04],
                        [0.05, 0.05],
                    ]
                    expect(result!.geometry.coordinates).toEqual(expectedRoute);

                    const resultTwo = routeFinder.getRoute(end, start);
                    expect(resultTwo).not.toBeNull();
                    expect(routeIsLongerThanDirectPath(result!, start, end)).toBe(true);
                    expect(getReasonIfLineStringInvalid(resultTwo)).toBe(undefined);
                    expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
                    expect(resultTwo!.geometry.coordinates).toEqual(expectedRoute.reverse());
                })
            })

            describe('complete graph star polygon', () => {
                it('with six sides (hexagon)', () => {
                    const network = generateStarPolygon(5, 1, [0, 0]);
                    const points = getUniqueCoordinatesFromLineStrings(network);
                    routeFinder.buildRouteGraph(network);

                    for (let i = 0; i < points.length - 1; i++) {
                        const start = createPointFeature(points[i]);
                        const end = createPointFeature(points[i + 1]);
                        const result = routeFinder.getRoute(start, end);
                        expect(result).not.toBeNull();
                        expect(routeIsLongerThanDirectPath(result!, start, end)).toBe(true);
                        expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
                        expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
                        expect(result?.geometry.coordinates).toHaveLength(2);
                    }
                });

                it('with sixteen sides (hexadecagon)', () => {
                    const network = generateStarPolygon(16, 1, [0, 0]);
                    const points = getUniqueCoordinatesFromLineStrings(network);
                    routeFinder.buildRouteGraph(network);

                    for (let i = 0; i < points.length - 1; i++) {
                        const start = createPointFeature(points[i]);
                        const end = createPointFeature(points[i + 1]);
                        const result = routeFinder.getRoute(start, end);
                        expect(result).not.toBeNull();
                        expect(routeIsLongerThanDirectPath(result!, start, end)).toBe(true);
                        expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
                        expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
                        expect(result?.geometry.coordinates).toHaveLength(2);
                    }
                });
            })

            describe('star polygon', () => {
                it('with six sides (hexagon)', () => {
                    const network = generateStarPolygon(5, 1, [0, 0], false);
                    const points = getUniqueCoordinatesFromLineStrings(network)
                    routeFinder.buildRouteGraph(network);

                    for (let i = 1; i < points.length; i++) {
                        const start = createPointFeature(points[0]);
                        const end = createPointFeature(points[i]);

                        const result = routeFinder.getRoute(start, end);
                        expect(result).not.toBeNull();
                        expect(routeIsLongerThanDirectPath(result!, start, end)).toBe(true);
                        expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
                        expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
                        expect(result?.geometry.coordinates.length).toBeGreaterThan(0);

                        // The route should not be longer than 3 coordinates (2 segments)
                        expect(result?.geometry.coordinates.length).toBeLessThanOrEqual(3);
                    }
                });

                it('with sixteen sides (hexadecagon)', () => {
                    const network = generateStarPolygon(16, 1, [0, 0], false);
                    const points = getUniqueCoordinatesFromLineStrings(network)
                    routeFinder.buildRouteGraph(network);

                    for (let i = 1; i < points.length; i++) {
                        const start = createPointFeature(points[0]);
                        const end = createPointFeature(points[i]);

                        const result = routeFinder.getRoute(start, end);
                        expect(result).not.toBeNull();
                        expect(routeIsLongerThanDirectPath(result!, start, end)).toBe(true);
                        expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
                        expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
                        expect(result?.geometry.coordinates.length).toBeGreaterThan(0);

                        // The route should not be longer than 9 coordinates (8 segments)
                        expect(result?.geometry.coordinates.length).toBeLessThanOrEqual(9);
                    }
                });
            });

            describe('tree structure', () => {
                it('of depth 5 and branching factor of 2', () => {
                    const depth = 5;
                    const network = generateTreeFeatureCollection(depth, 2)
                    const points = getUniqueCoordinatesFromLineStrings(network)
                    routeFinder.buildRouteGraph(network);

                    const start = createPointFeature(points[0]);
                    const end = createPointFeature(points[points.length - 1]);

                    const result = routeFinder.getRoute(start, end);
                    expect(result).not.toBeNull();
                    expect(routeIsLongerThanDirectPath(result!, start, end)).toBe(true);
                    expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
                    expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
                    expect(result?.geometry.coordinates.length).toBe(depth + 1);
                });
            });

            describe('concentric rings', () => {
                it('with 3 rings', () => {
                    const network = generateConcentricRings(3, 10, 1, [0, 0])
                    const points = getUniqueCoordinatesFromLineStrings(network)
                    routeFinder.buildRouteGraph(network);

                    for (let i = 1; i < points.length; i++) {
                        const start = createPointFeature(points[0]);
                        const end = createPointFeature(points[i]);

                        const result = routeFinder.getRoute(start, end);

                        expect(result).not.toBeNull();
                        expect(routeIsLongerThanDirectPath(result!, start, end)).toBe(true);
                        expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
                        expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
                        expect(result?.geometry.coordinates.length).toBeGreaterThan(0);
                        expect(result?.geometry.coordinates.length).toBeLessThanOrEqual(9);
                    }
                })

                it('with 5 rings', () => {
                    const network = generateConcentricRings(5, 10, 1, [0, 0])
                    const points = getUniqueCoordinatesFromLineStrings(network)
                    routeFinder.buildRouteGraph(network);

                    for (let i = 1; i < points.length; i++) {
                        const start = createPointFeature(points[0]);
                        const end = createPointFeature(points[i]);

                        const result = routeFinder.getRoute(start, end);
                        expect(result).not.toBeNull();

                        expect(routeIsLongerThanDirectPath(result!, start, end)).toBe(true);
                        expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
                        expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
                        expect(result?.geometry.coordinates.length).toBeGreaterThan(0);
                        expect(result?.geometry.coordinates.length).toBeLessThanOrEqual(13);
                    }
                })
            })
        });
    })
});
