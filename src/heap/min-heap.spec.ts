import { MinHeap } from "./min-heap";

describe("MinHeap", () => {
    let minHeap: MinHeap;

    beforeEach(() => {
        minHeap = new MinHeap();
    });

    it("inserts and extracts a single element", () => {
        expect(minHeap.size()).toBe(0);

        minHeap.insert(5, 123);

        expect(minHeap.size()).toBe(1);
        expect(minHeap.extractMin()).toBe(123);
        expect(minHeap.size()).toBe(0);
    });

    it("extracts null when the heap is empty", () => {
        expect(minHeap.extractMin()).toBeNull();
        expect(minHeap.size()).toBe(0);
    });

    it("peekMinKey returns null for empty and reflects current min", () => {
        expect(minHeap.peekMinKey()).toBeNull();
        minHeap.insert(10, 1);
        expect(minHeap.peekMinKey()).toBe(10);
        minHeap.insert(5, 2);
        expect(minHeap.peekMinKey()).toBe(5);
        minHeap.extractMin();
        expect(minHeap.peekMinKey()).toBe(10);
    });

    it("maintains proper order for ascending key inserts", () => {
        const keys = [1, 2, 3, 4, 5];
        keys.forEach((key) => {
            minHeap.insert(key, key + 100);
        });

        // Expect the smallest key to be extracted first
        expect(minHeap.extractMin()).toBe(101); // key=1 => value=101
        expect(minHeap.extractMin()).toBe(102); // key=2 => value=102
        expect(minHeap.extractMin()).toBe(103);
        expect(minHeap.extractMin()).toBe(104);
        expect(minHeap.extractMin()).toBe(105);
        expect(minHeap.extractMin()).toBeNull();
    });

    it("maintains proper order for descending key inserts", () => {
        const keys = [5, 4, 3, 2, 1];
        keys.forEach((key) => {
            minHeap.insert(key, key + 200);
        });

        // The smallest key is 1
        expect(minHeap.extractMin()).toBe(201);
        // Next smallest is 2
        expect(minHeap.extractMin()).toBe(202);
        // Then 3, 4, 5
        expect(minHeap.extractMin()).toBe(203);
        expect(minHeap.extractMin()).toBe(204);
        expect(minHeap.extractMin()).toBe(205);
        expect(minHeap.extractMin()).toBeNull();
    });

    it("handles duplicate keys by respecting insertion order", () => {
        // Insert multiple items with the same key but different values
        minHeap.insert(10, 1);
        minHeap.insert(10, 2);
        minHeap.insert(10, 3);

        // The heap should prioritize the earliest inserted item first
        expect(minHeap.extractMin()).toBe(1);
        expect(minHeap.extractMin()).toBe(2);
        expect(minHeap.extractMin()).toBe(3);
        expect(minHeap.extractMin()).toBeNull();
    });

    it("handles a mix of negative and positive keys", () => {
        const items = [
            { key: -10, value: 1 },
            { key: 0, value: 2 },
            { key: 10, value: 3 },
            { key: -5, value: 4 },
            { key: 5, value: 5 },
        ];
        items.forEach((item) => minHeap.insert(item.key, item.value));

        // Order of extracted values should respect key order (lowest key first)
        expect(minHeap.extractMin()).toBe(1); // key = -10
        expect(minHeap.extractMin()).toBe(4); // key = -5
        expect(minHeap.extractMin()).toBe(2); // key = 0
        expect(minHeap.extractMin()).toBe(5); // key = 5
        expect(minHeap.extractMin()).toBe(3); // key = 10
        expect(minHeap.extractMin()).toBeNull();
    });

    it("reflects correct size throughout inserts and extracts", () => {
        expect(minHeap.size()).toBe(0);

        minHeap.insert(2, 100);
        minHeap.insert(1, 200);
        minHeap.insert(3, 300);

        expect(minHeap.size()).toBe(3);

        minHeap.extractMin(); // remove key=1
        expect(minHeap.size()).toBe(2);

        minHeap.extractMin(); // remove key=2
        expect(minHeap.size()).toBe(1);

        minHeap.extractMin(); // remove key=3
        expect(minHeap.size()).toBe(0);

        // Now empty, should return null
        expect(minHeap.extractMin()).toBeNull();
        expect(minHeap.size()).toBe(0);
    });

    it("handles random insertion order consistently", () => {
        const items = [5, 1, 4, 1, 3, 2, 8, 0, -1];
        items.forEach((k) => {
            minHeap.insert(k, k + 1000);
        });

        // Sort items to check expected order
        const sorted = [...items].sort((a, b) => a - b);
        sorted.forEach((expectedKey) => {
            const extractedValue = minHeap.extractMin();
            const expectedValue = expectedKey + 1000;
            expect(extractedValue).toBe(expectedValue);
        });
        expect(minHeap.extractMin()).toBeNull();
    });
});
