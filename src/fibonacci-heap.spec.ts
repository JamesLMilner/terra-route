import { FibonacciHeap } from './fibonacci-heap';

describe('FibonacciHeap', () => {
    let heap: FibonacciHeap;

    beforeEach(() => {
        heap = new FibonacciHeap();
    });

    test('insert() and size()', () => {
        expect(heap.size()).toBe(0);
        heap.insert(10, 1);
        expect(heap.size()).toBe(1);
        heap.insert(5, 2);
        expect(heap.size()).toBe(2);
    });

    test('extractMin() returns the correct value', () => {
        heap.insert(20, 101);
        heap.insert(5, 102);
        heap.insert(15, 103);

        expect(heap.extractMin()).toBe(102); // key 5
        expect(heap.size()).toBe(2);
        expect(heap.extractMin()).toBe(103); // key 15
        expect(heap.extractMin()).toBe(101); // key 20
        expect(heap.extractMin()).toBeNull();
    });

    test('extractMin() on empty heap returns null', () => {
        expect(heap.extractMin()).toBeNull();
    });

    test('insert() handles duplicate keys', () => {
        heap.insert(10, 201);
        heap.insert(10, 202);
        heap.insert(10, 203);

        const values = [heap.extractMin(), heap.extractMin(), heap.extractMin()];
        expect(values).toContain(201);
        expect(values).toContain(202);
        expect(values).toContain(203);
        expect(heap.size()).toBe(0);
    });

    test('interleaved insert and extractMin()', () => {
        heap.insert(30, 301);
        heap.insert(10, 302);
        expect(heap.extractMin()).toBe(302);
        heap.insert(20, 303);
        expect(heap.extractMin()).toBe(303);
        expect(heap.extractMin()).toBe(301);
        expect(heap.extractMin()).toBeNull();
    });
});
