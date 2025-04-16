import { FibonacciHeap } from "./fibonacci-heap";

describe("FibonacciHeap", () => {
    it("should report size zero for a new heap", () => {
        const heap = new FibonacciHeap();
        expect(heap.size()).toBe(0);
    });

    it("should insert a single element and extract it as the minimum", () => {
        const heap = new FibonacciHeap();
        heap.insert(42, 42);
        expect(heap.size()).toBe(1);
        expect(heap.extractMin()).toBe(42);
        expect(heap.size()).toBe(0);
    });

    it("should always extract the smallest key first when inserting ascending keys", () => {
        const heap = new FibonacciHeap();
        for (let key = 1; key <= 10; key += 1) {
            heap.insert(key, key);
        }
        expect(heap.extractMin()).toBe(1);
    });

    it("should extract elements in ascending order regardless of insertion order", () => {
        const heap = new FibonacciHeap();
        const keys = [5, 3, 8, 1, 7, 2, 4, 6];
        keys.forEach((key) => heap.insert(key, key));

        const extracted: number[] = [];
        while (heap.size() > 0) {
            const value = heap.extractMin();
            // value is typed as number | null but should never be null inside the loop
            extracted.push(value as number);
        }

        expect(extracted).toEqual(keys.slice().sort((first, second) => first - second));
    });

    it("should handle duplicate keys correctly and still extract all values", () => {
        const heap = new FibonacciHeap();
        heap.insert(10, 100);
        heap.insert(10, 200);
        heap.insert(5, 50);

        expect(heap.extractMin()).toBe(50); // key 5
        // the two duplicate keys (10) can come out in any order for value
        const remaining = [heap.extractMin(), heap.extractMin()].sort();
        expect(remaining).toEqual([100, 200]);
        expect(heap.extractMin()).toBeNull();
    });

    it("should return null when extracting from an empty heap", () => {
        const heap = new FibonacciHeap();
        expect(heap.extractMin()).toBeNull();
    });

    it("should update size correctly after mixed insert and extract operations", () => {
        const heap = new FibonacciHeap();
        heap.insert(20, 20);
        heap.insert(5, 5);
        heap.insert(15, 15);
        expect(heap.size()).toBe(3);

        heap.extractMin(); // removes value 5
        expect(heap.size()).toBe(2);

        heap.extractMin(); // removes value 15
        heap.extractMin(); // removes value 20
        expect(heap.size()).toBe(0);
    });

    it("should cope with a larger randomised workload", () => {
        const heap = new FibonacciHeap();
        const elementCount = 1000;
        const insertedKeys: number[] = [];

        for (let index = 0; index < elementCount; index += 1) {
            // random key in range [0, 9999]
            const randomKey = Math.floor(Math.random() * 10000);
            insertedKeys.push(randomKey);
            heap.insert(randomKey, randomKey);
        }
        insertedKeys.sort((first, second) => first - second);

        const extracted: number[] = [];
        let extractedValue: number | null;
        do {
            extractedValue = heap.extractMin();
            if (extractedValue !== null) {
                extracted.push(extractedValue);
            }
        } while (extractedValue !== null);

        expect(extracted).toEqual(insertedKeys);
        expect(heap.size()).toBe(0);
    });
});
