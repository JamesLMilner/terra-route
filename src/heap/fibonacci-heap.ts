import { Heap } from "./heap";

/**
 * Internal node representation for the Fibonacci heap, expressed as a plain
 * JavaScript object (no dedicated class).
 */
interface FibonacciNode {
    key: number;
    value: number;
    degree: number;
    parent: FibonacciNode | null;
    child: FibonacciNode | null;
    next: FibonacciNode; // clockwise pointer in circular list
    prev: FibonacciNode; // counter‑clockwise pointer in circular list
    mark: boolean;       // used by decrease‑key (not implemented here)
}

/**
 * Fibonacci heap that conforms to the Terra Route `Heap` interface.
 * Only the heap itself is a class; each node is a lightweight object created
 * inline where needed.
 */
export class FibonacciHeap implements Heap {
    private minNode: FibonacciNode | null = null;
    private totalNodes = 0;

    /**
     * Inserts a new `(key, value)` pair into the heap.
     */
    public insert(key: number, value: number): void {
        // ---------------- inline node creation ---------------- //
        const node: FibonacciNode = {
            key,
            value,
            degree: 0,
            parent: null,
            child: null,
            next: null as unknown as FibonacciNode,
            prev: null as unknown as FibonacciNode,
            mark: false,
        };
        node.next = node;
        node.prev = node;
        // ------------------------------------------------------- //

        if (this.minNode === null) {
            this.minNode = node;
        } else {
            // splice node into the circular doubly‑linked root list right after `minNode`
            node.prev = this.minNode;
            node.next = this.minNode.next;
            this.minNode.next.prev = node;
            this.minNode.next = node;

            if (node.key < this.minNode.key) {
                this.minNode = node;
            }
        }

        this.totalNodes += 1;
    }

    /**
     * Removes and returns the value associated with the minimum key. Returns
     * `null` if the heap is empty.
     */
    public extractMin(): number | null {
        const oldMin = this.minNode;
        if (oldMin === null) {
            return null;
        }

        // Promote each child of `oldMin` to the root list
        if (oldMin.child !== null) {
            let childStart = oldMin.child;
            const children: FibonacciNode[] = [];
            do {
                children.push(childStart);
                childStart = childStart.next;
            } while (childStart !== oldMin.child);

            for (const child of children) {
                // detach from child list
                child.parent = null;
                child.prev.next = child.next;
                child.next.prev = child.prev;

                // add to root list right after `oldMin`
                child.prev = this.minNode!;
                child.next = this.minNode!.next;
                this.minNode!.next.prev = child;
                this.minNode!.next = child;
            }
        }

        // Remove `oldMin` from root list
        oldMin.prev.next = oldMin.next;
        oldMin.next.prev = oldMin.prev;

        if (oldMin === oldMin.next) {
            // The heap had exactly one root node and is now empty
            this.minNode = null;
        } else {
            this.minNode = oldMin.next;
            this.consolidate();
        }

        this.totalNodes -= 1;
        return oldMin.value;
    }

    /** Returns the number of elements stored in the heap. */
    public size(): number {
        return this.totalNodes;
    }

    public peekMinKey(): number {
        return this.minNode === null ? Number.POSITIVE_INFINITY : this.minNode.key;
    }

    public clear(): void {
        this.minNode = null;
        this.totalNodes = 0;
    }

    // --------------------------- internal helpers --------------------------- //

    /**
     * Merges trees of equal degree so that at most one root of each degree
     * remains. Runs in `O(log n)` time and is called after `extractMin`.
     */
    private consolidate(): void {
        if (this.minNode === null) {
            return;
        }

        // upper bound for the degree of any node is ⌊log₂ n⌋
        const upperBound = Math.floor(Math.log2(this.totalNodes)) + 2;
        const degreeTable: Array<FibonacciNode | null> = new Array(upperBound).fill(null);

        // snapshot of the current root list prior to mutation
        const rootList: FibonacciNode[] = [];
        let currentRoot = this.minNode;
        do {
            rootList.push(currentRoot);
            currentRoot = currentRoot.next;
        } while (currentRoot !== this.minNode);

        for (const root of rootList) {
            let x = root;
            let degree = x.degree;

            while (degreeTable[degree] !== null) {
                let y = degreeTable[degree] as FibonacciNode;
                if (y.key < x.key) {
                    // ensure `x` has the smaller key
                    const temporary = x;
                    x = y;
                    y = temporary;
                }
                this.link(y, x);
                degreeTable[degree] = null;
                degree += 1;
            }
            degreeTable[degree] = x;
        }

        // rebuild root list and identify new minimum
        this.minNode = null;
        for (const node of degreeTable) {
            if (node === null) {
                continue;
            }

            if (this.minNode === null) {
                this.minNode = node;
                node.prev = node;
                node.next = node;
            } else {
                // insert `node` right after current min
                node.prev = this.minNode;
                node.next = this.minNode.next;
                this.minNode.next.prev = node;
                this.minNode.next = node;

                if (node.key < this.minNode.key) {
                    this.minNode = node;
                }
            }
        }
    }

    /**
     * Makes `child` a child of `parent`. Assumes both nodes are roots of equal
     * degree. Runs in `O(1)` time.
     */
    private link(child: FibonacciNode, parent: FibonacciNode): void {
        // detach `child` from the root list
        child.prev.next = child.next;
        child.next.prev = child.prev;

        // make `child` a child of `parent`
        child.parent = parent;
        child.mark = false;

        if (parent.child === null) {
            parent.child = child;
            child.prev = child;
            child.next = child;
        } else {
            child.prev = parent.child;
            child.next = parent.child.next;
            parent.child.next.prev = child;
            parent.child.next = child;
        }

        parent.degree += 1;
    }
}
