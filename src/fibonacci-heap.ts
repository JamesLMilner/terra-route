type FibNode = {
    key: number;
    value: number;
    degree: number;
    mark: boolean;
    parent: FibNode | null;
    child: FibNode | null;
    left: FibNode;
    right: FibNode;
};

export class FibonacciHeap {
    private nodeCount = 0;
    private minNode: FibNode | null = null;

    insert(key: number, value: number): void {
        const node: FibNode = {
            key,
            value,
            degree: 0,
            mark: false,
            parent: null,
            child: null,
            left: null as any,
            right: null as any,
        };
        node.left = node;
        node.right = node;

        this.minNode = this.mergeLists(this.minNode, node);
        this.nodeCount++;
    }

    extractMin(): number | null {
        const z = this.minNode;
        if (!z) return null;

        // Add children to root list
        if (z.child) {
            let child = z.child;
            do {
                child.parent = null;
                child = child.right!;
            } while (child !== z.child);
            this.minNode = this.mergeLists(this.minNode, z.child);
        }

        this.removeFromList(z);

        if (z === z.right) {
            this.minNode = null;
        } else {
            this.minNode = z.right;
            this.consolidate();
        }

        this.nodeCount--;
        return z.value;
    }

    size(): number {
        return this.nodeCount;
    }

    // ========== Internal Methods ==========

    private consolidate(): void {
        const maxDegree = Math.floor(Math.log2(this.nodeCount)) + 1;
        const A = new Array<FibNode | null>(maxDegree).fill(null);

        const rootList: FibNode[] = [];
        let curr = this.minNode!;
        do {
            rootList.push(curr);
            curr = curr.right!;
        } while (curr !== this.minNode);

        for (const w of rootList) {
            let x = w;
            let d = x.degree;
            while (A[d]) {
                let y = A[d]!;
                if (x.key > y.key) {
                    const temp = x;
                    x = y;
                    y = temp;
                }
                this.link(y, x);
                A[d] = null;
                d++;
            }
            A[d] = x;
        }

        this.minNode = null;
        for (const node of A) {
            if (node) {
                this.minNode = this.mergeLists(this.minNode, node);
            }
        }
    }

    private link(y: FibNode, x: FibNode): void {
        this.removeFromList(y);
        y.left = y.right = y;
        x.child = this.mergeLists(x.child, y);
        y.parent = x;
        x.degree++;
        y.mark = false;
    }

    private mergeLists(a: FibNode | null, b: FibNode | null): FibNode {
        if (!a) return b!;
        if (!b) return a;

        const aRight = a.right!;
        const bRight = b.right!;

        a.right = bRight;
        bRight.left = a;
        b.right = aRight;
        aRight.left = b;

        return a.key < b.key ? a : b;
    }

    private removeFromList(node: FibNode): void {
        node.left.right = node.right;
        node.right.left = node.left;
    }
}
