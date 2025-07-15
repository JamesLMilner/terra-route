import TinyQueue from './tinyqueue';

describe('TinyQueue', () => {
    it('should create a queue', () => {
        const queue = new TinyQueue();
        expect(queue).toBeDefined();
    });

    it('should push and pop items', () => {
        const queue = new TinyQueue<{ value: number }>([], (a, b) => a.value - b.value);
        queue.push({ value: 3 });
        queue.push({ value: 1 });
        queue.push({ value: 2 });

        expect(queue.pop()?.value).toBe(1);
        expect(queue.pop()?.value).toBe(2);
        expect(queue.pop()?.value).toBe(3);
        expect(queue.pop()).toBeUndefined();
    });

    it('should peek at the top item', () => {
        const queue = new TinyQueue<{ value: number }>([], (a, b) => a.value - b.value);
        queue.push({ value: 3 });
        queue.push({ value: 1 });
        queue.push({ value: 2 });

        expect(queue.peek()?.value).toBe(1);
        queue.pop();
        expect(queue.peek()?.value).toBe(2);
    });

    it('should handle an empty queue', () => {
        const queue = new TinyQueue();
        expect(queue.pop()).toBeUndefined();
        expect(queue.peek()).toBeUndefined();
    });

    it('should handle initial data', () => {
        const data = [{ value: 3 }, { value: 1 }, { value: 2 }];
        const queue = new TinyQueue<{ value: number }>(data, (a, b) => a.value - b.value);
        expect(queue.pop()?.value).toBe(1);
    });

    it('should use default comparator', () => {
        const queue = new TinyQueue<number>();
        queue.push(3);
        queue.push(1);
        queue.push(2);
        expect(queue.pop()).toBe(1);
    });
});
