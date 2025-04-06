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
        const { heap } = this;
        const length = heap.length;
        // Grab the parent node once, then move it down only if needed
        const node = heap[idx];
        const nodeKey = node.key;
        const nodeIndex = node.index;

        while (true) {
            // Calculate left and right child indexes
            const leftIdx = (idx << 1) + 1;
            if (leftIdx >= length) {
                // No children => we’re already in place
                break;
            }

            // Assume left child is the smaller one by default
            let smallestIdx = leftIdx;
            let smallestKey = heap[leftIdx].key;
            let smallestIndex = heap[leftIdx].index;

            const rightIdx = leftIdx + 1;
            if (rightIdx < length) {
                // Compare left child vs. right child
                const rightKey = heap[rightIdx].key;
                const rightIndex = heap[rightIdx].index;
                if (rightKey < smallestKey || (rightKey === smallestKey && rightIndex < smallestIndex)) {
                    smallestIdx = rightIdx;
                    smallestKey = rightKey;
                    smallestIndex = rightIndex;
                }
            }

            // Compare the smaller child with the parent
            if (smallestKey < nodeKey || (smallestKey === nodeKey && smallestIndex < nodeIndex)) {
                // Swap the smaller child up
                heap[idx] = heap[smallestIdx];
                idx = smallestIdx;
            } else {
                // We’re in the correct position now, so stop
                break;
            }
        }

        // Place the original node in its final position
        heap[idx] = node;
    }
}
