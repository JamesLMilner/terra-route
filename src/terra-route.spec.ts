import { createCheapRuler } from "./distance/cheap-ruler";
import { TerraRoute } from "./terra-route";
import { createFeatureCollection, createLineStringFeature, createPointFeature, generateConcentricRings, generateGridWithDiagonals, generateStarPolygon, generateTreeFeatureCollection, getReasonIfLineStringInvalid, getUniqueCoordinatesFromLineStrings } from "./test-utils/test-utils";


describe("TerraRoute", () => {

    let routeFinder: TerraRoute;

    beforeEach(() => {
        routeFinder = new TerraRoute();
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

    it("returns null when no path exists between start and end", () => {
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

    it("returns a single-point route if start and end are the same", () => {
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

    it("returns null when the network is empty", () => {
        const network = createFeatureCollection([]);

        const routeFinder = new TerraRoute();
        routeFinder.buildRouteGraph(network);
        const start = createPointFeature([0, 0]);
        const end = createPointFeature([1, 1]);

        const result = routeFinder.getRoute(start, end);

        expect(result).toBeNull();
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
        expect(result!.geometry.coordinates[0]).toEqual([0, 0]);
        expect(result!.geometry.coordinates.at(-1)).toEqual([2, 0]);
    });

    it("returns null if start or end are not on any segment", () => {
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

    it("returns null if start and end are not on any segment", () => {
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
        const end = createPointFeature([30, 0]);

        const result = routeFinder.getRoute(start, end);

        expect(result).toBeNull();
    });

    it("returns null if start and end are not on any segment", () => {
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
        const end = createPointFeature([30, 0]);

        const result = routeFinder.getRoute(start, end);

        expect(result).toBeNull();
    });

    it("chooses the shortest path using diagonals in a 3x3 grid", () => {
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
        expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
        expect(resultTwo!.geometry.coordinates).toEqual(expectedRoute.reverse());
    });

    it("chooses the shortest path using diagonals in a 10x10 grid", () => {
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
        expect(getReasonIfLineStringInvalid(resultTwo)).toBe(undefined);
        expect(resultTwo!.geometry.coordinates).toEqual(expectedRoute.reverse());
    })

    it('is able to route through a interconnected hexagonal star polygon ignoring other routes than the direct line', () => {
        const network = generateStarPolygon(5, 1, [0, 0]);
        const points = getUniqueCoordinatesFromLineStrings(network);
        routeFinder.buildRouteGraph(network);

        for (let i = 0; i < points.length - 1; i++) {
            const start = createPointFeature(points[i]);
            const end = createPointFeature(points[i + 1]);
            const result = routeFinder.getRoute(start, end);
            expect(result).not.toBeNull();
            expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
            expect(result?.geometry.coordinates).toHaveLength(2);
        }
    });

    it('is able to route through a interconnected hexadecagon star polygon ignoring other routes than the direct line', () => {
        const network = generateStarPolygon(16, 1, [0, 0]);
        const points = getUniqueCoordinatesFromLineStrings(network);
        routeFinder.buildRouteGraph(network);

        for (let i = 0; i < points.length - 1; i++) {
            const start = createPointFeature(points[i]);
            const end = createPointFeature(points[i + 1]);
            const result = routeFinder.getRoute(start, end);
            expect(result).not.toBeNull();
            expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
            expect(result?.geometry.coordinates).toHaveLength(2);
        }
    });

    it('is able to route around a non-interconnected hexagon star polygon', () => {
        const network = generateStarPolygon(5, 1, [0, 0], false);
        const points = getUniqueCoordinatesFromLineStrings(network)
        routeFinder.buildRouteGraph(network);

        for (let i = 1; i < points.length; i++) {
            const start = createPointFeature(points[0]);
            const end = createPointFeature(points[i]);

            const result = routeFinder.getRoute(start, end);
            expect(result).not.toBeNull();
            expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
            expect(result?.geometry.coordinates.length).toBeGreaterThan(0);

            // The route should not be longer than 3 coordinates (2 segments)
            expect(result?.geometry.coordinates.length).toBeLessThanOrEqual(3);
        }
    });

    it('is able to route around a non-interconnected hexadecagon star polygon', () => {
        const network = generateStarPolygon(16, 1, [0, 0], false);
        const points = getUniqueCoordinatesFromLineStrings(network)
        routeFinder.buildRouteGraph(network);

        for (let i = 1; i < points.length; i++) {
            const start = createPointFeature(points[0]);
            const end = createPointFeature(points[i]);

            const result = routeFinder.getRoute(start, end);
            expect(result).not.toBeNull();
            expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
            expect(result?.geometry.coordinates.length).toBeGreaterThan(0);

            // The route should not be longer than 9 coordinates (8 segments)
            expect(result?.geometry.coordinates.length).toBeLessThanOrEqual(9);
        }

    });

    it('is able to traverse a tree structure of depth 5 and branching factor of 2', () => {
        const depth = 5;
        const network = generateTreeFeatureCollection(depth, 2)
        const points = getUniqueCoordinatesFromLineStrings(network)
        routeFinder.buildRouteGraph(network);

        const start = createPointFeature(points[0]);
        const end = createPointFeature(points[points.length - 1]);

        const result = routeFinder.getRoute(start, end);
        expect(result).not.toBeNull();
        expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
        expect(result?.geometry.coordinates.length).toBe(depth + 1);
    });

    it('is able to traverse a concentric graph with 3 rings', () => {
        const network = generateConcentricRings(3, 10, 1, [0, 0])
        const points = getUniqueCoordinatesFromLineStrings(network)
        routeFinder.buildRouteGraph(network);

        for (let i = 1; i < points.length; i++) {
            const start = createPointFeature(points[0]);
            const end = createPointFeature(points[i]);

            const result = routeFinder.getRoute(start, end);

            expect(result).not.toBeNull();
            expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
            expect(result?.geometry.coordinates.length).toBeGreaterThan(0);
            expect(result?.geometry.coordinates.length).toBeLessThanOrEqual(9);
        }
    })

    it('is able to traverse a concentric graph with 5 rings', () => {
        const network = generateConcentricRings(5, 10, 1, [0, 0])
        const points = getUniqueCoordinatesFromLineStrings(network)
        routeFinder.buildRouteGraph(network);

        for (let i = 1; i < points.length; i++) {
            const start = createPointFeature(points[0]);
            const end = createPointFeature(points[i]);

            const result = routeFinder.getRoute(start, end);
            expect(result).not.toBeNull();
            expect(getReasonIfLineStringInvalid(result)).toBe(undefined);
            expect(result?.geometry.coordinates.length).toBeGreaterThan(0);
            expect(result?.geometry.coordinates.length).toBeLessThanOrEqual(13);
        }
    })
});
