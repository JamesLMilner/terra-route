// Adapted from https://github.com/mourner/kdbush

// ISC License

// Copyright (c) 2018, Vladimir Agafonkin

// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.

// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
// OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
// TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
// THIS SOFTWARE.

const ARRAY_TYPES = [
    Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array,
    Int32Array, Uint32Array, Float32Array, Float64Array
];

const VERSION = 1;
const HEADER_SIZE = 8;

export class KDBush {
    public data: ArrayBuffer;
    public ids: Uint16Array | Uint32Array;
    public coords: InstanceType<TypedArrayConstructor>;
    private _pos: number;
    private _finished: boolean;
    public numItems: number;
    public nodeSize: number;
    private ArrayType: TypedArrayConstructor;
    private IndexArrayType: typeof Uint16Array | typeof Uint32Array;

    constructor(
        numItems: number,
        nodeSize: number = 64,
        ArrayType: TypedArrayConstructor = Float64Array,
        data?: ArrayBuffer
    ) {
        if (isNaN(numItems) || numItems < 0) {
            throw new Error(`Unexpected numItems value: ${numItems}.`);
        }

        this.numItems = numItems;
        this.nodeSize = Math.min(Math.max(nodeSize, 2), 65535);
        this.ArrayType = ArrayType;
        this.IndexArrayType = numItems < 65536 ? Uint16Array : Uint32Array;

        const arrayTypeIndex = ARRAY_TYPES.indexOf(this.ArrayType);
        const coordsByteSize = numItems * 2 * this.ArrayType.BYTES_PER_ELEMENT;
        const idsByteSize = numItems * this.IndexArrayType.BYTES_PER_ELEMENT;
        const padCoords = (8 - idsByteSize % 8) % 8;

        if (arrayTypeIndex < 0) {
            throw new Error(`Unexpected typed array class: ${ArrayType}.`);
        }

        if (data) {
            this.data = data;
            this.ids = new (this.IndexArrayType as any)(this.data, HEADER_SIZE, numItems);
            this.coords = new (this.ArrayType as any)(this.data, HEADER_SIZE + idsByteSize + padCoords, numItems * 2);
            this._pos = numItems * 2;
            this._finished = true;
        } else {
            this.data = new ArrayBuffer(HEADER_SIZE + coordsByteSize + idsByteSize + padCoords);
            this.ids = new (this.IndexArrayType as any)(this.data, HEADER_SIZE, numItems);
            this.coords = new (this.ArrayType as any)(this.data, HEADER_SIZE + idsByteSize + padCoords, numItems * 2);
            this._pos = 0;
            this._finished = false;

            new Uint8Array(this.data, 0, 2).set([0xdb, (VERSION << 4) + arrayTypeIndex]);
            new Uint16Array(this.data, 2, 1)[0] = this.nodeSize;
            new Uint32Array(this.data, 4, 1)[0] = this.numItems;
        }
    }

    add(x: number, y: number): number {
        const index = this._pos >> 1;
        this.ids[index] = index;
        this.coords[this._pos++] = x;
        this.coords[this._pos++] = y;
        return index;
    }

    finish(): this {
        const numAdded = this._pos >> 1;
        if (numAdded !== this.numItems) {
            throw new Error(`Added ${numAdded} items when expected ${this.numItems}.`);
        }
        sort(this.ids, this.coords, this.nodeSize, 0, this.numItems - 1, 0);
        this._finished = true;
        return this;
    }
}

type TypedArrayConstructor =
    Int8ArrayConstructor | Uint8ArrayConstructor | Uint8ClampedArrayConstructor |
    Int16ArrayConstructor | Uint16ArrayConstructor |
    Int32ArrayConstructor | Uint32ArrayConstructor |
    Float32ArrayConstructor | Float64ArrayConstructor;

function sort(
    ids: Uint16Array | Uint32Array,
    coords: InstanceType<TypedArrayConstructor>,
    nodeSize: number,
    left: number,
    right: number,
    axis: number
): void {
    if (right - left <= nodeSize) return;
    const m = (left + right) >> 1;
    select(ids, coords, m, left, right, axis);
    sort(ids, coords, nodeSize, left, m - 1, 1 - axis);
    sort(ids, coords, nodeSize, m + 1, right, 1 - axis);
}

function select(
    ids: Uint16Array | Uint32Array,
    coords: InstanceType<TypedArrayConstructor>,
    k: number,
    left: number,
    right: number,
    axis: number
): void {
    while (right > left) {
        if (right - left > 600) {
            const n = right - left + 1;
            const m = k - left + 1;
            const z = Math.log(n);
            const s = 0.5 * Math.exp(2 * z / 3);
            const sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
            const newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
            const newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
            select(ids, coords, k, newLeft, newRight, axis);
        }

        const t = coords[2 * k + axis];
        let i = left;
        let j = right;

        swapItem(ids, coords, left, k);
        if (coords[2 * right + axis] > t) {
            swapItem(ids, coords, left, right);
        }

        while (i < j) {
            swapItem(ids, coords, i, j);
            i++;
            j--;
            while (coords[2 * i + axis] < t) i++;
            while (coords[2 * j + axis] > t) j--;
        }

        if (coords[2 * left + axis] === t) {
            swapItem(ids, coords, left, j);
        } else {
            j++;
            swapItem(ids, coords, j, right);
        }

        if (j <= k) left = j + 1;
        if (k <= j) right = j - 1;
    }
}

function swapItem(
    ids: Uint16Array | Uint32Array,
    coords: InstanceType<TypedArrayConstructor>,
    i: number,
    j: number
): void {
    swap(ids, i, j);
    swap(coords, 2 * i, 2 * j);
    swap(coords, 2 * i + 1, 2 * j + 1);
}

function swap<T extends Uint16Array | Uint32Array | Float32Array | Float64Array | Int8Array | Int16Array | Int32Array | Uint8Array | Uint8ClampedArray>(
    arr: T,
    i: number,
    j: number
): void {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}
