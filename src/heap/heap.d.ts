export interface Heap {
    insert: (key: number, value: number) => void;
    extractMin: () => number | null;
    /** Returns the smallest key without removing it, or null if empty. */
    peekMinKey?: () => number | null;
    size: () => number;
}

export interface HeapConstructor {
    // new() returns an instance that implements ExampleInterface
    new(): Heap;
}