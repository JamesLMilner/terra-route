import { createCheapRuler } from "./cheap-ruler";
import type { Position } from "geojson";

describe("createCheapRuler", () => {
    it("returns 0 for the same point", () => {
        const ruler = createCheapRuler(50);
        const a: Position = [30, 50];
        const b: Position = [30, 50];
        expect(ruler(a, b)).toBeCloseTo(0, 6);
    });

    it("computes approximate distance between nearby points", () => {
        const ruler = createCheapRuler(50.5);
        const a: Position = [30.5, 50.5];
        const b: Position = [30.51, 50.49];
        const distance = ruler(a, b);
        expect(distance).toBeGreaterThan(0);
        expect(distance).toBeCloseTo(1.3, 1); // Ballpark expectation for city-scale distance
    });

    it("correctly handles longitude wrapping from -179 to 179", () => {
        const ruler = createCheapRuler(0);
        const a: Position = [-179.9, 0];
        const b: Position = [179.9, 0];
        const distance = ruler(a, b);
        expect(distance).toBeCloseTo(22.24, 1); // Small distance over the dateline
    });

    it("returns longer distance for points further apart", () => {
        const ruler = createCheapRuler(45);
        const a: Position = [0, 45];
        const b: Position = [1, 46];
        const shortDistance = ruler(a, b);

        const c: Position = [0, 45];
        const d: Position = [5, 50];
        const longDistance = ruler(c, d);

        expect(longDistance).toBeGreaterThan(shortDistance);
    });

    it("works correctly near the equator", () => {
        const ruler = createCheapRuler(0);
        const a: Position = [0, 0];
        const b: Position = [0.1, 0.1];
        const distance = ruler(a, b);
        expect(distance).toBeGreaterThan(0);
        expect(distance).toBeCloseTo(15.7, 1);
    });

    it("works correctly near the poles", () => {
        const ruler = createCheapRuler(89);
        const a: Position = [0, 89];
        const b: Position = [0.1, 89.1];
        const distance = ruler(a, b);
        expect(distance).toBeGreaterThan(0);
    });

    it("is symmetric (distance from A to B equals B to A)", () => {
        const ruler = createCheapRuler(50);
        const a: Position = [10, 50];
        const b: Position = [11, 49];
        const d1 = ruler(a, b);
        const d2 = ruler(b, a);
        expect(d1).toBeCloseTo(d2, 6);
    });
});