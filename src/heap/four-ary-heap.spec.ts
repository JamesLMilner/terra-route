import { FourAryHeap } from "./four-ary-heap";

describe("FourAryHeap", () => {
    it("starts empty", () => {
        const heap = new FourAryHeap();
        expect(heap.size()).toBe(0);
        expect(heap.peekMinKey()).toBeNull();
        expect(heap.extractMin()).toBeNull();
    });

    it("peekMinKey returns current min without removing it", () => {
        const heap = new FourAryHeap();
        heap.insert(10, 1);
        expect(heap.peekMinKey()).toBe(10);
        heap.insert(5, 2);
        expect(heap.peekMinKey()).toBe(5);
        expect(heap.size()).toBe(2);
        expect(heap.extractMin()).toBe(2);
        expect(heap.peekMinKey()).toBe(10);
    });

    it("inserts and extracts a single element", () => {
        const heap = new FourAryHeap();
        heap.insert(5, 123);
        expect(heap.size()).toBe(1);
        expect(heap.extractMin()).toBe(123);
        expect(heap.size()).toBe(0);
        expect(heap.extractMin()).toBeNull();
    });

    it("extracts in ascending key order for ascending inserts", () => {
        const heap = new FourAryHeap();
        [1, 2, 3, 4, 5].forEach((k) => heap.insert(k, k + 100));

        expect(heap.extractMin()).toBe(101);
        expect(heap.extractMin()).toBe(102);
        expect(heap.extractMin()).toBe(103);
        expect(heap.extractMin()).toBe(104);
        expect(heap.extractMin()).toBe(105);
        expect(heap.extractMin()).toBeNull();
    });

    it("extracts in ascending key order for descending inserts", () => {
        const heap = new FourAryHeap();
        [5, 4, 3, 2, 1].forEach((k) => heap.insert(k, k + 200));

        expect(heap.extractMin()).toBe(201);
        expect(heap.extractMin()).toBe(202);
        expect(heap.extractMin()).toBe(203);
        expect(heap.extractMin()).toBe(204);
        expect(heap.extractMin()).toBe(205);
        expect(heap.extractMin()).toBeNull();
    });

    it("is stable for duplicate keys (FIFO among equals)", () => {
        const heap = new FourAryHeap();
        heap.insert(10, 1);
        heap.insert(10, 2);
        heap.insert(10, 3);
        heap.insert(5, 99); // smaller key should come out first

        expect(heap.extractMin()).toBe(99); // key 5
        // Now all key=10, should preserve insertion order
        expect(heap.extractMin()).toBe(1);
        expect(heap.extractMin()).toBe(2);
        expect(heap.extractMin()).toBe(3);
        expect(heap.extractMin()).toBeNull();
    });

    it("handles a mix of negative and positive keys", () => {
        const heap = new FourAryHeap();
        const items = [
            { key: -10, value: 1 },
            { key: 0, value: 2 },
            { key: 10, value: 3 },
            { key: -5, value: 4 },
            { key: 5, value: 5 },
        ];
        items.forEach((it) => heap.insert(it.key, it.value));

        expect(heap.extractMin()).toBe(1); // -10
        expect(heap.extractMin()).toBe(4); // -5
        expect(heap.extractMin()).toBe(2); // 0
        expect(heap.extractMin()).toBe(5); // 5
        expect(heap.extractMin()).toBe(3); // 10
        expect(heap.extractMin()).toBeNull();
    });

    it("updates size correctly across operations", () => {
        const heap = new FourAryHeap();
        expect(heap.size()).toBe(0);

        heap.insert(2, 100);
        heap.insert(1, 200);
        heap.insert(3, 300);
        expect(heap.size()).toBe(3);

        expect(heap.extractMin()).toBe(200); // key 1
        expect(heap.size()).toBe(2);

        expect(heap.extractMin()).toBe(100); // key 2
        expect(heap.size()).toBe(1);

        expect(heap.extractMin()).toBe(300); // key 3
        expect(heap.size()).toBe(0);

        expect(heap.extractMin()).toBeNull();
        expect(heap.size()).toBe(0);
    });

    it("maintains stability with interleaved inserts for equal keys", () => {
        const heap = new FourAryHeap();
        // Insert several equal keys, then interleave more later
        heap.insert(2, 1); // 1st with key=2
        heap.insert(2, 2); // 2nd with key=2
        heap.insert(1, 9); // smallest
        heap.insert(3, 8);
        heap.insert(2, 3); // 3rd with key=2
        heap.insert(2, 4); // 4th with key=2

        // Smallest key first
        expect(heap.extractMin()).toBe(9); // key=1
        // Now all remaining mins are key=2; order should be FIFO among them
        expect(heap.extractMin()).toBe(1);
        expect(heap.extractMin()).toBe(2);
        expect(heap.extractMin()).toBe(3);
        expect(heap.extractMin()).toBe(4);
        expect(heap.extractMin()).toBe(8); // key=3
        expect(heap.extractMin()).toBeNull();
    });

    it("produces sorted and stable output for a random workload", () => {
        const heap = new FourAryHeap();
        const items: { key: number; value: number; idx: number }[] = [];

        const count = 5000;
        const keyRange = 100; // many duplicates to stress stability
        for (let i = 0; i < count; i += 1) {
            const key = Math.floor(Math.random() * keyRange) - Math.floor(keyRange / 2);
            const value = i; // use insertion index as value to check stability among equals
            items.push({ key, value, idx: i });
            heap.insert(key, value);
        }

        // Compute expected order: by key asc, then original index asc (stable)
        const expectedValues = items
            .slice()
            .sort((a, b) => (a.key === b.key ? a.idx - b.idx : a.key - b.key))
            .map((x) => x.value);

        const extracted: number[] = [];
        let v: number | null;
        do {
            v = heap.extractMin();
            if (v !== null) extracted.push(v);
        } while (v !== null);

        expect(extracted).toEqual(expectedValues);
        expect(heap.size()).toBe(0);
    });
});
