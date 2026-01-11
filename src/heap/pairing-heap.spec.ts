import { PairingHeap } from "./pairing-heap";

describe("PairingHeap", () => {
    it("starts empty", () => {
        const heap = new PairingHeap();
        expect(heap.size()).toBe(0);
        expect(heap.extractMin()).toBeNull();
    });

    it("inserts elements and extracts them in ascending key order", () => {
        const heap = new PairingHeap();

        heap.insert(10, 10);
        heap.insert(5, 5);
        heap.insert(20, 20);

        expect(heap.size()).toBe(3);

        expect(heap.extractMin()).toBe(5);
        expect(heap.extractMin()).toBe(10);
        expect(heap.extractMin()).toBe(20);

        expect(heap.size()).toBe(0);
        expect(heap.extractMin()).toBeNull();
    });

    it("handles duplicate keys correctly", () => {
        const heap = new PairingHeap();

        heap.insert(7, 70);
        heap.insert(7, 71);
        heap.insert(3, 30);

        // The two smallest keys are equal (3 and 7). The order of equal‑key
        // removals is not defined, but each extracted value must correspond
        // to the minimum remaining key.
        const first = heap.extractMin();
        expect(first).toBe(30);

        const second = heap.extractMin();
        const third = heap.extractMin();
        const extractedValues = [second, third].sort((a, b) => (a as number) - (b as number));

        expect(extractedValues).toEqual([70, 71]);
    });

    it("works with negative keys", () => {
        const heap = new PairingHeap();

        heap.insert(-2, -2);
        heap.insert(-10, -10);
        heap.insert(0, 0);

        expect(heap.extractMin()).toBe(-10);
        expect(heap.extractMin()).toBe(-2);
        expect(heap.extractMin()).toBe(0);
    });

    it("maintains size correctly through mixed operations", () => {
        const heap = new PairingHeap();

        heap.insert(4, 4);
        heap.insert(1, 1);
        heap.insert(3, 3);
        expect(heap.size()).toBe(3);

        heap.extractMin(); // removes 1
        expect(heap.size()).toBe(2);

        heap.insert(2, 2);
        expect(heap.size()).toBe(3);

        heap.extractMin(); // removes 2
        heap.extractMin(); // removes 3
        heap.extractMin(); // removes 4
        expect(heap.size()).toBe(0);
    });

    it("can handle a large random workload and still produce sorted output", () => {
        const heap = new PairingHeap();

        const randomValues: number[] = [];
        const elementCount = 10_000;

        for (let index = 0; index < elementCount; index += 1) {
            const key = Math.floor(Math.random() * 1_000_000) - 500_000;
            randomValues.push(key);
            heap.insert(key, key);
        }

        randomValues.sort((a, b) => a - b);

        for (let index = 0; index < elementCount; index += 1) {
            const extracted = heap.extractMin();
            expect(extracted).toBe(randomValues[index]);
        }

        expect(heap.size()).toBe(0);
        expect(heap.extractMin()).toBeNull();
    });
});
