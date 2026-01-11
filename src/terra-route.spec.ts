import { createCheapRuler } from "./distance/cheap-ruler";
import { TerraRoute } from "./terra-route";
import {
    createFeatureCollection, createLineStringFeature, createPointFeature,
} from "./test-utils/create";

import {
    generateConcentricRings, generateGridWithDiagonals, generateStarPolygon, generateTreeFeatureCollection,
} from "./test-utils/generate-network";

import {
    getReasonIfLineStringInvalid, getUniqueCoordinatesFromLineStrings, routeIsLongerThanDirectPath, startAndEndAreCorrect
} from "./test-utils/utils";

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
            const routeFinder = new TerraRoute({ distanceMeasurement: customDistance });
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

            expect(true).toBe(true);
        });
    })

    describe('getRoute', () => {
        it('throws an error if the network is not built', () => {
            const start = createPointFeature([0, 0]);
            const end = createPointFeature([1, 1]);

            expect(() => routeFinder.getRoute(start, end)).toThrow("Network not built. Please call buildRouteGraph(network) first.");
        })

        it("returns null when the start equals the end", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 0],
                ]),
            ]);

            routeFinder.buildRouteGraph(network);

            const point = createPointFeature([0, 0]);
            expect(routeFinder.getRoute(point, point)).toBeNull();
        });

        it("returns null when the start and end are not connected (even if both points are new)", () => {
            const network = createFeatureCollection([
                // Component A
                createLineStringFeature([
                    [0, 0],
                    [1, 0],
                ]),
                // Component B
                createLineStringFeature([
                    [10, 0],
                    [11, 0],
                ]),
            ]);

            routeFinder.buildRouteGraph(network);

            // Use points not present in the network.
            const start = createPointFeature([100, 100]);
            const end = createPointFeature([101, 101]);

            expect(routeFinder.getRoute(start, end)).toBeNull();
        });

        it("returns null when both points are outside the network", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 0],
                ]),
            ]);

            routeFinder.buildRouteGraph(network);

            // Both points are outside the network; the implementation should handle this gracefully.
            const start = createPointFeature([2, 0]);
            const end = createPointFeature([3, 0]);

            // Still disconnected, so route is null.
            expect(routeFinder.getRoute(start, end)).toBeNull();
        });

        it("can route between two points added at runtime when the link is provided", () => {
            const network = createFeatureCollection([
                // Base network doesn't matter; we will force a mode that relies on runtime-added links.
                createLineStringFeature([
                    [0, 0],
                    [1, 0],
                ]),
            ]);

            routeFinder.buildRouteGraph(network);

            // Force a mode that relies on the runtime adjacency list.
            type TerraRouteInternals = {
                csrOffsets: Int32Array | null;
                csrIndices: Int32Array | null;
                csrDistances: Float64Array | null;
                csrNodeCount: number;
                coordinateIndexMap: Map<number, Map<number, number>>;
                adjacencyList: Array<Array<{ node: number; distance: number }>>;
            };

            const internal = routeFinder as unknown as TerraRouteInternals;
            internal.csrOffsets = null;
            internal.csrIndices = null;
            internal.csrDistances = null;
            internal.csrNodeCount = 0;

            // Create two new points and then connect them via a runtime-provided link.
            const start = createPointFeature([5, 5]);
            const end = createPointFeature([6, 5]);

            // First call creates internal nodes (still no route).
            expect(routeFinder.getRoute(start, end)).toBeNull();

            const startIndex = internal.coordinateIndexMap.get(5)!.get(5)!;
            const endIndex = internal.coordinateIndexMap.get(6)!.get(5)!;

            // Add a link both ways so routing can traverse.
            internal.adjacencyList[startIndex].push({ node: endIndex, distance: 1 });
            internal.adjacencyList[endIndex].push({ node: startIndex, distance: 1 });

            const route = routeFinder.getRoute(start, end);
            expect(route).not.toBeNull();
            expect(route!.geometry.coordinates).toEqual([
                [5, 5],
                [6, 5],
            ]);
        });

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

            routeFinder = new TerraRoute({ distanceMeasurement: distance });
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

        it("supports a custom heap implementation", () => {
            // Minimal heap that satisfies the expected interface (extracts minimum key).
            class SimpleMinHeap {
                private items: Array<{ key: number; value: number }> = [];
                insert(key: number, value: number) {
                    this.items.push({ key, value });
                }
                extractMin() {
                    if (this.items.length === 0) return null;
                    let minIndex = 0;
                    for (let i = 1; i < this.items.length; i++) {
                        if (this.items[i].key < this.items[minIndex].key) minIndex = i;
                    }
                    return this.items.splice(minIndex, 1)[0].value;
                }
                size() {
                    return this.items.length;
                }
            }

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

            const heapConstructor = SimpleMinHeap as unknown as new () => {
                insert: (key: number, value: number) => void;
                extractMin: () => number | null;
                size: () => number;
            };

            const rf = new TerraRoute({ heap: heapConstructor });
            rf.buildRouteGraph(network);

            const start = createPointFeature([0, 0]);
            const end = createPointFeature([2, 1]);

            const result = rf.getRoute(start, end);
            expect(result).not.toBeNull();
            expect(result!.geometry.coordinates).toEqual([
                [0, 0],
                [1, 0],
                [2, 0],
                [2, 1],
            ]);
        });

        it("prefers the shortest route even when there are many alternatives", () => {
            // A short corridor from start to end, plus lots of distracting branches.
            const corridor: number[][] = [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [4, 0],
                [5, 0],
                [6, 0],
            ];

            const features = [createLineStringFeature(corridor)];

            // Add many branches off the early corridor nodes to enlarge the frontier.
            // These branches don't lead to the end.
            for (let i = 0; i <= 3; i++) {
                for (let b = 1; b <= 20; b++) {
                    features.push(createLineStringFeature([
                        [i, 0],
                        [i, b],
                    ]));
                }
            }

            // Add a couple of loops to create multiple improvements for some nodes.
            features.push(createLineStringFeature([
                [1, 0],
                [1, 1],
                [2, 0],
            ]));
            features.push(createLineStringFeature([
                [2, 0],
                [2, 1],
                [3, 0],
            ]));

            const network = createFeatureCollection(features);
            routeFinder.buildRouteGraph(network);

            const start = createPointFeature([0, 0]);
            const end = createPointFeature([6, 0]);

            const result = routeFinder.getRoute(start, end);
            expect(result).not.toBeNull();
            expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
            expect(startAndEndAreCorrect(result!, start, end)).toBe(true);
            expect(result!.geometry.coordinates).toEqual(corridor);
        });

        it("returns a route across imbalanced branching", () => {
            // Start side: large star (many edges) feeding into a single corridor.
            // End side: small local neighborhood. This encourages the reverse side to expand at least once.

            const features = [] as ReturnType<typeof createLineStringFeature>[];

            // Core corridor: (0,0) -> (1,0) -> (2,0) -> (3,0)
            features.push(createLineStringFeature([
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
            ]));

            // Heavy fan-out at the start node: many leaves that don't help reach the end.
            for (let i = 1; i <= 60; i++) {
                features.push(createLineStringFeature([
                    [0, 0],
                    [-i, i],
                ]));
            }

            // Light branching near the end.
            features.push(createLineStringFeature([
                [3, 0],
                [3, 1],
            ]));

            const network = createFeatureCollection(features);
            routeFinder.buildRouteGraph(network);

            const start = createPointFeature([0, 0]);
            const end = createPointFeature([3, 0]);

            const result = routeFinder.getRoute(start, end);
            expect(result).not.toBeNull();
            expect(result!.geometry.coordinates).toEqual([
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
            ]);
        });

        it("returns null when only one of the points can reach the network", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 0],
                    [2, 0],
                ]),
            ]);

            routeFinder.buildRouteGraph(network);

            const start = createPointFeature([10, 10]);
            const end = createPointFeature([2, 0]);

            const result = routeFinder.getRoute(start, end);
            expect(result).toBeNull();
        });

        it("returns a route after being called multiple times", () => {
            const network = createFeatureCollection([
                createLineStringFeature([
                    [0, 0],
                    [1, 0],
                    [2, 0],
                ]),
                createLineStringFeature([
                    [2, 0],
                    [3, 0],
                ]),
            ]);

            routeFinder.buildRouteGraph(network);

            const start1 = createPointFeature([0, 0]);
            const end1 = createPointFeature([3, 0]);
            const first = routeFinder.getRoute(start1, end1);
            expect(first).not.toBeNull();
            expect(first!.geometry.coordinates).toEqual([
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
            ]);

            const start2 = createPointFeature([1, 0]);
            const end2 = createPointFeature([2, 0]);
            const second = routeFinder.getRoute(start2, end2);
            expect(second).not.toBeNull();
            expect(second!.geometry.coordinates).toEqual([
                [1, 0],
                [2, 0],
            ]);
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
