import { haversineDistance } from "./haversine";
import type { Position } from "geojson";

describe("haversineDistance", () => {
    it("returns 0 for the same point", () => {
        const a: Position = [0, 0];
        expect(haversineDistance(a, a)).toBeCloseTo(0, 6);
    });

    it("is symmetric", () => {
        const a: Position = [10, 10];
        const b: Position = [20, 20];
        const d1 = haversineDistance(a, b);
        const d2 = haversineDistance(b, a);
        expect(d1).toBeCloseTo(d2, 6);
    });

    it("computes correct distance for a known pair of coordinates", () => {
        // From Paris (48.8566, 2.3522) to London (51.5074, -0.1278)
        const paris: Position = [2.3522, 48.8566];
        const london: Position = [-0.1278, 51.5074];
        const distance = haversineDistance(paris, london);

        // Actual distance is approximately 343 km
        expect(distance).toBeCloseTo(343.55, 1);
    });

});