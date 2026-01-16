import { Heap } from "./heap";

interface Node {
    key: number;
    value: number;
    index: number; // insertion order for stable tie-breaking
}

/**
 * A 4-ary min-heap with stable tie-breaking on insertion order.
 * Parent(i) = floor((i - 1) / 4)
 * Children(i) = 4*i + 1 .. 4*i + 4
 */
export class FourAryHeap implements Heap {
    // Parallel arrays for fewer object allocations and faster property access
    private keys: number[] = [];
    private values: number[] = [];
    private idxs: number[] = [];
    private length = 0; // number of valid elements
    private insertCounter = 0;

    insert(key: number, value: number): void {
        // Bubble-up using local variables (avoid temporary node object)
        let i = this.length;
        this.length = i + 1;

        let ck = key;
        let cv = value;
        let ci = this.insertCounter++;

        while (i > 0) {
            const p = (i - 1) >>> 2; // divide by 4
            const pk = this.keys[p];
            const pi = this.idxs[p];
            if (ck > pk || (ck === pk && ci > pi)) break;

            // move parent down
            this.keys[i] = pk;
            this.values[i] = this.values[p];
            this.idxs[i] = pi;
            i = p;
        }

        // place the new node
        this.keys[i] = ck;
        this.values[i] = cv;
        this.idxs[i] = ci;
    }

    extractMin(): number | null {
        const n = this.length;
        if (n === 0) return null;

        const minValue = this.values[0];
        const last = n - 1;
        this.length = last;

        if (last > 0) {
            // Move last element to root then bubble down
            this.keys[0] = this.keys[last];
            this.values[0] = this.values[last];
            this.idxs[0] = this.idxs[last];
            this.bubbleDown(0);
        }

        return minValue;
    }

    peekMinKey(): number {
        return this.length === 0 ? Number.POSITIVE_INFINITY : this.keys[0];
    }

    clear(): void {
        // Keep backing arrays to avoid allocations; just reset counters.
        this.length = 0;
        this.insertCounter = 0;
    }

    size(): number {
        return this.length;
    }

    private bubbleDown(i: number): void {
        const n = this.length;
        const k = this.keys;
        const v = this.values;
        const idx = this.idxs;

        const nodeK = k[i];
        const nodeV = v[i];
        const nodeI = idx[i];

        while (true) {
            const c1 = (i << 2) + 1; // 4*i + 1
            if (c1 >= n) break; // no children

            // find smallest among up to 4 children
            let smallest = c1;
            let sK = k[c1];
            let sI = idx[c1];
            let sV = v[c1];

            const c2 = c1 + 1;
            if (c2 < n) {
                const k2 = k[c2];
                const i2 = idx[c2];
                if (k2 < sK || (k2 === sK && i2 < sI)) {
                    smallest = c2;
                    sK = k2;
                    sI = i2;
                    sV = v[c2];
                }
            }

            const c3 = c1 + 2;
            if (c3 < n) {
                const k3 = k[c3];
                const i3 = idx[c3];
                if (k3 < sK || (k3 === sK && i3 < sI)) {
                    smallest = c3;
                    sK = k3;
                    sI = i3;
                    sV = v[c3];
                }
            }

            const c4 = c1 + 3;
            if (c4 < n) {
                const k4 = k[c4];
                const i4 = idx[c4];
                if (k4 < sK || (k4 === sK && i4 < sI)) {
                    smallest = c4;
                    sK = k4;
                    sI = i4;
                    sV = v[c4];
                }
            }

            if (sK < nodeK || (sK === nodeK && sI < nodeI)) {
                k[i] = sK;
                v[i] = sV;
                idx[i] = sI;
                i = smallest;
            } else {
                break;
            }
        }

        k[i] = nodeK;
        v[i] = nodeV;
        idx[i] = nodeI;
    }
}
