export interface Heap {
    insert: (key: number, value: number) => void;
    extractMin: () => number | null;
    // Optional: return the current minimum key without removing it.
    // When absent, callers should fall back to a safe (but looser) stopping rule.
    peekMinKey?: () => number;
    // Optional: reset heap state for reuse.
    clear?: () => void;
    size: () => number;
}

export interface HeapConstructor {
    // new() returns an instance that implements ExampleInterface
    new(): Heap;
}