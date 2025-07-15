import { KDBush } from './kdbush';

describe('KDBush', () => {
    const points = [
        [0, 0], [1, 1], [2, 2], [3, 3],
        [1, 0], [0, 1], [3, 2], [2, 3]
    ];

    it('should build an index correctly', () => {
        const index = new KDBush(points.length);
        for (const p of points) {
            index.add(p[0], p[1]);
        }
        index.finish();

        expect(index.ids.length).toBe(points.length);
        expect(index.coords.length).toBe(points.length * 2);
        // Check if ids are a permutation of 0..n-1
        expect(Array.from(index.ids).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });

    it('should throw an error if finish is called with wrong number of points', () => {
        const index = new KDBush(points.length);
        index.add(0, 0);
        expect(() => index.finish()).toThrow('Added 1 items when expected 8.');
    });

    it('should handle different array types', () => {
        const index = new KDBush(points.length, 64, Float32Array);
        for (const p of points) {
            index.add(p[0], p[1]);
        }
        index.finish();
        expect(index.coords).toBeInstanceOf(Float32Array);
    });

    it('should throw on invalid numItems', () => {
        expect(() => new KDBush(-1)).toThrow('Unexpected numItems value: -1.');
        expect(() => new KDBush(NaN)).toThrow('Unexpected numItems value: NaN.');
    });

    it('should throw on invalid ArrayType', () => {
        // @ts-expect-error
        expect(() => new KDBush(1, 64, Array)).toThrow('Unexpected typed array class: function Array() { [native code] }');
    });

    it('should reconstruct an index from data', () => {
        const index = new KDBush(points.length);
        for (const p of points) {
            index.add(p[0], p[1]);
        }
        index.finish();

        const data = index.data;
        const index2 = new KDBush(points.length, 64, Float64Array, data);

        expect(index2.ids).toEqual(index.ids);
        expect(index2.coords).toEqual(index.coords);
        expect(index2.numItems).toBe(index.numItems);
        expect(index2.nodeSize).toBe(index.nodeSize);
    });

    it('should use Uint32Array for large number of items', () => {
        const index = new KDBush(70000);
        expect(index.ids).toBeInstanceOf(Uint32Array);
    });
});
