// Adapted from https://github.com/mourner/kdbush

// ISC License

// Copyright (c) 2017, Vladimir Agafonkin

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

export default class TinyQueue<T> {

    private data: T[];
    public length: number;
    private compare: (a: T, b: T) => number;

    constructor(
        data: T[] = [],
        compare: (a: T, b: T) => number = (a, b) =>
            a < b ? -1 : a > b ? 1 : 0
    ) {
        this.data = data;
        this.length = this.data.length;
        this.compare = compare;

        if (this.length > 0) {
            for (let i = (this.length >> 1) - 1; i >= 0; i--) {
                this._down(i);
            }
        }
    }

    push(item: T): void {
        this.data.push(item);
        this._up(this.length++);
    }

    pop(): T | undefined {
        if (this.length === 0) {
            return undefined;
        }

        const top = this.data[0];
        const bottom = this.data.pop() as T;

        this.length--;

        if (this.length > 0) {
            this.data[0] = bottom;
            this._down(0);
        }

        return top;
    }

    peek(): T | undefined {
        return this.data[0];
    }

    private _up(pos: number): void {
        const { data, compare } = this;
        const item = data[pos];

        while (pos > 0) {
            const parent = (pos - 1) >> 1;
            const current = data[parent];
            if (compare(item, current) >= 0) {
                break;
            }
            data[pos] = current;
            pos = parent;
        }

        data[pos] = item;
    }

    private _down(pos: number): void {
        const { data, compare } = this;
        const halfLength = this.length >> 1;
        const item = data[pos];

        while (pos < halfLength) {
            let bestChild = (pos << 1) + 1;
            const right = bestChild + 1;

            if (right < this.length && compare(data[right], data[bestChild]) < 0) {
                bestChild = right;
            }

            if (compare(data[bestChild], item) >= 0) {
                break;
            }

            data[pos] = data[bestChild];
            pos = bestChild;
        }

        data[pos] = item;
    }
}
