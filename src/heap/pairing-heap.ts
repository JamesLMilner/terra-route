import { Heap } from "./heap";

class PairingHeapNode {
    key: number;
    value: number;
    child: PairingHeapNode | null = null;
    sibling: PairingHeapNode | null = null;

    constructor(key: number, value: number) {
        this.key = key;
        this.value = value;
    }
}

export class PairingHeap implements Heap {
    private root: PairingHeapNode | null = null;
    private heapSize = 0;

    public insert(key: number, value: number): void {
        const node = new PairingHeapNode(key, value);
        this.root = this.merge(this.root, node);
        this.heapSize++;
    }

    public extractMin(): number | null {
        if (!this.root) {
            return null;
        }

        const minValue = this.root.value;
        const minChild = this.root.child;

        // Detach the old root
        this.root.child = null;

        // Combine all children of the old root
        this.root = this.combineSiblings(minChild);
        this.heapSize--;

        return minValue;
    }

    public size(): number {
        return this.heapSize;
    }

    public clear(): void {
        this.root = null;
        this.heapSize = 0;
    }

    /**
     * Merges two pairing heaps into one. Assumes each parameter is a root.
     * Returns the root of the merged tree.
     */
    private merge(a: PairingHeapNode | null, b: PairingHeapNode | null): PairingHeapNode | null {
        if (!a) {
            return b;
        }
        if (!b) {
            return a;
        }
        if (a.key <= b.key) {
            // Make b a child of a
            b.sibling = a.child;
            a.child = b;
            return a;
        } else {
            // Make a a child of b
            a.sibling = b.child;
            b.child = a;
            return b;
        }
    }

    /**
     * Merges an entire list of siblings into a single root using a two‐pass pairing strategy.
     */
    private combineSiblings(firstSibling: PairingHeapNode | null): PairingHeapNode | null {
        if (!firstSibling || !firstSibling.sibling) {
            // Zero or one sibling, so it's already merged
            return firstSibling;
        }

        // Step 1: Collect siblings into an array
        const siblingArray: PairingHeapNode[] = [];
        let current: PairingHeapNode | null = firstSibling;
        while (current) {
            const next: PairingHeapNode = current.sibling!;
            current.sibling = null;
            siblingArray.push(current);
            current = next;
        }

        // Step 2: Pair up neighbors and merge them
        let i = 0;
        for (; i + 1 < siblingArray.length; i += 2) {
            siblingArray[i] = this.merge(siblingArray[i], siblingArray[i + 1])!;
        }

        // If we had an odd number of siblings, 'i' is now pointing at the last single sibling
        // Step 3: Merge the resulting heaps left to right
        let j = i - 2;
        // j starts at the second‐to‐last pair
        if (j < 0) {
            j = 0;
        }
        for (; j >= 0; j -= 2) {
            siblingArray[j] = this.merge(siblingArray[j], siblingArray[j + 2])!;
        }

        return siblingArray[0];
    }
}
