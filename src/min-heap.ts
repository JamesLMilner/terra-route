export class MinHeap {
    private heap: Array<{ key: number; value: number; index: number }> = [];
    private insertCounter = 0;

    insert(key: number, value: number): void {
        const node = { key, value, index: this.insertCounter++ };
        let idx = this.heap.length;
        this.heap.push(node);

        // Optimized Bubble Up
        while (idx > 0) {
            const parentIdx = (idx - 1) >>> 1; // Fast Math.floor((idx - 1) / 2)
            const parent = this.heap[parentIdx];
            if (node.key > parent.key || (node.key === parent.key && node.index > parent.index)) break;
            this.heap[idx] = parent;
            idx = parentIdx;
        }
        this.heap[idx] = node;
    }

    extractMin(): number | null {
        const length = this.heap.length;
        if (length === 0) return null;

        const minNode = this.heap[0];
        const endNode = this.heap.pop()!;

        if (length > 1) {
            this.heap[0] = endNode;
            this.bubbleDown(0);
        }

        return minNode.value;
    }

    size(): number {
        return this.heap.length;
    }

    private bubbleDown(idx: number): void {
        const length = this.heap.length;
        const node = this.heap[idx];

        while (true) {
            const leftIdx = (idx << 1) + 1;
            const rightIdx = leftIdx + 1;
            let smallestIdx = idx;

            if (
                leftIdx < length &&
                (this.heap[leftIdx].key < this.heap[smallestIdx].key ||
                    (this.heap[leftIdx].key === this.heap[smallestIdx].key &&
                        this.heap[leftIdx].index < this.heap[smallestIdx].index))
            ) {
                smallestIdx = leftIdx;
            }

            if (
                rightIdx < length &&
                (this.heap[rightIdx].key < this.heap[smallestIdx].key ||
                    (this.heap[rightIdx].key === this.heap[smallestIdx].key &&
                        this.heap[rightIdx].index < this.heap[smallestIdx].index))
            ) {
                smallestIdx = rightIdx;
            }

            if (smallestIdx === idx) break;

            this.heap[idx] = this.heap[smallestIdx];
            this.heap[smallestIdx] = node;

            idx = smallestIdx;
        }
    }
}
