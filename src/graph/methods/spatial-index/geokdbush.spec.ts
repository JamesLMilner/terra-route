import { KDBush } from './kdbush';
import { around, distance } from './geokdbush';

describe('geokdbush', () => {
    const points = [
        [0, 0], [1, 1], [2, 2], [3, 3],
        [1, 0], [0, 1], [3, 2], [2, 3]
    ];
    const index = new KDBush(points.length);
    for (const p of points) {
        index.add(p[0], p[1]);
    }
    index.finish();

    it('should return points within a given radius', () => {
        const d = distance(0, 0, 1, 1);
        const result = around(index, 0, 0, Infinity, d + 1);
        const resultPoints = result.map(i => points[i]);
        expect(resultPoints).toEqual(expect.arrayContaining([
            [0, 0], [1, 1], [1, 0], [0, 1]
        ]));
        expect(resultPoints.length).toBe(4);
    });

    it('defaults to maxResults and maxDistance being Infinity', () => {
        const result = around(index, 0, 0);
        expect(result.length).toBe(points.length);
        const resultPoints = result.map(i => points[i]);
        expect(resultPoints).toEqual(expect.arrayContaining(points));
    });

    it('should return an empty array if no points are within the radius', () => {
        const result = around(index, 10, 10, Infinity, 1);
        expect(result).toEqual([]);
    });

    it('should handle maxResults correctly', () => {
        const result = around(index, 0, 0, 2);
        expect(result.length).toBe(2);
    });

    it('should also export a distance function', () => {
        expect(distance(0, 0, 1, 1)).toBeCloseTo(157.2493, 2);
    });

    describe('with a larger number of points', () => {
        const largePoints: [number, number][] = [];
        for (let i = 0; i < 1000; i++) {
            // Points around London
            largePoints.push([
                -0.1278 + (Math.random() - 0.5) * 2,
                51.5074 + (Math.random() - 0.5) * 2
            ]);
        }
        const index = new KDBush(largePoints.length, 16);
        for (const p of largePoints) {
            index.add(p[0], p[1]);
        }
        index.finish();

        it('should find points around a location', () => {
            const results = around(index, -0.1278, 51.5074, 10);
            expect(results.length).toBe(10);
            results.forEach(i => {
                const p = largePoints[i];
                expect(distance(p[0], p[1], -0.1278, 51.5074)).toBeLessThan(200); // 200km, rough check
            });
        });

        it('should find points within a radius', () => {
            const results = around(index, -0.1278, 51.5074, Infinity, 10); // 10km radius
            expect(results.length).toBeGreaterThan(0);
            results.forEach(i => {
                const p = largePoints[i];
                expect(distance(p[0], p[1], -0.1278, 51.5074)).toBeLessThanOrEqual(10);
            });
        });
    });

    it('should work with maxResults being undefined', () => {
        const result = around(index, 0, 0, undefined);
        expect(result.length).toBe(points.length);
    });


});
