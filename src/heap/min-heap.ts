import { Heap } from "./heap";

export class MinHeap implements Heap {
    private heap: Array<{ key: number; value: number; index: number }> = [];
    private insertCounter = 0;

    insert(key: number, value: number): void {
        const node = { key, value, index: this.insertCounter++ };
        let currentIndex = this.heap.length;
        this.heap.push(node);

        while (currentIndex > 0) {
            const parentIndex = (currentIndex - 1) >>> 1;
            const parent = this.heap[parentIndex];

            if (
                key > parent.key ||
                (key === parent.key && node.index > parent.index)
            ) {
                break;
            }

            this.heap[currentIndex] = parent;
            currentIndex = parentIndex;
        }

        this.heap[currentIndex] = node;
    }

    extractMin(): number | null {
        const heap = this.heap;
        const length = heap.length;

        if (length === 0) {
            return null;
        }

        const minNode = heap[0];
        const endNode = heap.pop()!;

        if (length > 1) {
            heap[0] = endNode;
            this.bubbleDown(0);
        }

        return minNode.value;
    }

    size(): number {
        return this.heap.length;
    }

    private bubbleDown(index: number): void {
        const heap = this.heap;
        const length = heap.length;
        const node = heap[index];
        const nodeKey = node.key;
        const nodeIndex = node.index;

        while (true) {
            const leftChildIndex = (index << 1) + 1;
            if (leftChildIndex >= length) {
                break;
            }

            let smallestIndex = leftChildIndex;
            let smallest = heap[leftChildIndex];

            const rightChildIndex = leftChildIndex + 1;
            if (rightChildIndex < length) {
                const right = heap[rightChildIndex];
                if (
                    right.key < smallest.key ||
                    (right.key === smallest.key && right.index < smallest.index)
                ) {
                    smallestIndex = rightChildIndex;
                    smallest = right;
                }
            }

            if (
                smallest.key < nodeKey ||
                (smallest.key === nodeKey && smallest.index < nodeIndex)
            ) {
                heap[index] = smallest;
                index = smallestIndex;
            } else {
                break;
            }
        }

        heap[index] = node;
    }
}
