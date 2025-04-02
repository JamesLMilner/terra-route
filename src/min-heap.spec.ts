import { MinHeap } from './min-heap';

describe('MinHeap', () => {
    let heap: MinHeap;

    beforeEach(() => {
        heap = new MinHeap();
    });

    it('should create an empty heap', () => {
        expect(heap.size()).toBe(0);
    });

    it('should insert a single element', () => {
        heap.insert(5, 100);
        expect(heap.size()).toBe(1);
        expect(heap.extractMin()).toBe(100);
        expect(heap.size()).toBe(0);
    });

    it('should maintain correct heap order when inserting multiple elements', () => {
        heap.insert(10, 200);
        heap.insert(5, 100);
        heap.insert(3, 50);
        heap.insert(7, 150);

        expect(heap.size()).toBe(4);
        expect(heap.extractMin()).toBe(50);
        expect(heap.extractMin()).toBe(100);
        expect(heap.extractMin()).toBe(150);
        expect(heap.extractMin()).toBe(200);
        expect(heap.size()).toBe(0);
    });

    it('should return null when extracting from an empty heap', () => {
        expect(heap.extractMin()).toBeNull();
    });

    it('should handle duplicate keys properly', () => {
        heap.insert(5, 100);
        heap.insert(5, 200);
        heap.insert(5, 300);

        expect(heap.size()).toBe(3);
        expect(heap.extractMin()).toBe(100);
        expect(heap.extractMin()).toBe(200);
        expect(heap.extractMin()).toBe(300);
        expect(heap.size()).toBe(0);
    });

    it('should correctly reorder after sequential insert and extract', () => {
        heap.insert(10, 100);
        heap.insert(1, 50);
        expect(heap.extractMin()).toBe(50);

        heap.insert(2, 60);
        heap.insert(3, 70);
        expect(heap.extractMin()).toBe(60);
        expect(heap.extractMin()).toBe(70);
        expect(heap.extractMin()).toBe(100);
    });

    it('should handle large number of elements correctly', () => {
        const elements = Array.from({ length: 1000 }, (_, i) => ({ key: 1000 - i, value: i }));
        elements.forEach(el => heap.insert(el.key, el.value));

        expect(heap.size()).toBe(1000);

        for (let i = 999; i >= 0; i--) {
            expect(heap.extractMin()).toBe(i);
        }

        expect(heap.size()).toBe(0);
    });
});
