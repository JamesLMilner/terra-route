export interface Heap {
    insert: (key: number, value: number) => void;
    extractMin: () => number | null;
    size: () => number;
}

export interface HeapConstructor {
    // new() returns an instance that implements ExampleInterface
    new(): Heap;
}