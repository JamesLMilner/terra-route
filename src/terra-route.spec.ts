import { createCheapRuler } from "./distance/cheap-ruler";
import { TerraRoute } from "./terra-route";
import { createFeatureCollection, createLineStringFeature, createPointFeature } from "./test-utils/test-utils";

describe("TerraRoute", () => {
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

        const routeFinder = new TerraRoute(network);
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

        const routeFinder = new TerraRoute(network, distance);
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

        const routeFinder = new TerraRoute(network);
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

        const routeFinder = new TerraRoute(network);
        const start = createPointFeature([0, 0]);

        const result = routeFinder.getRoute(start, start);

        expect(result).not.toBeNull();
        expect(result!.geometry.coordinates).toEqual([[0, 0]]);
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

        const routeFinder = new TerraRoute(network);
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

        const routeFinder = new TerraRoute(network);
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

        const routeFinder = new TerraRoute(network);
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

        const routeFinder = new TerraRoute(network);
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

        const routeFinder = new TerraRoute(network);
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

    it("ignores duplicate coordinates within a segment", () => {
        const network = createFeatureCollection([
            createLineStringFeature([
                [0, 0],
                [1, 0],
                [1, 0],
                [2, 0],
            ]),
        ]);

        const routeFinder = new TerraRoute(network);
        const start = createPointFeature([0, 0]);
        const end = createPointFeature([2, 0]);

        const result = routeFinder.getRoute(start, end);

        expect(result).not.toBeNull();
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

        const routeFinder = new TerraRoute(network);
        const start = createPointFeature([10, 10]);
        const end = createPointFeature([2, 0]);

        const result = routeFinder.getRoute(start, end);

        expect(result).toBeNull();
    });
});
