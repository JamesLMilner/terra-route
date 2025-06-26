import { FeatureCollection, LineString, Position } from 'geojson'

/**
 * Counts the number of connected components in a graph represented by LineString features in a GeoJSON FeatureCollection.
 * Each LineString is treated as an edge in the graph, and connected components are determined by shared coordinates.
 * @param featureCollection - A GeoJSON FeatureCollection containing LineString features
 * @returns The number of connected components in the graph represented by the LineStrings
 */
export function countConnectedComponents(
    featureCollection: FeatureCollection<LineString>
): number {
    const features = featureCollection.features
    const numberOfFeatures = features.length

    // Map coordinates to feature indices
    const coordinateToFeatureIndices = new Map<string, number[]>()

    for (let index = 0; index < numberOfFeatures; index++) {
        const coordinates = features[index].geometry.coordinates

        for (const coordinate of coordinates) {
            const key = coordinateKey(coordinate)

            if (!coordinateToFeatureIndices.has(key)) {
                coordinateToFeatureIndices.set(key, [])
            }

            coordinateToFeatureIndices.get(key)!.push(index)
        }
    }

    // Build adjacency list for the graph
    const adjacencyList: number[][] = Array.from({ length: numberOfFeatures }, () => [])

    for (const indices of coordinateToFeatureIndices.values()) {
        for (let i = 0; i < indices.length; i++) {
            for (let j = i + 1; j < indices.length; j++) {
                const a = indices[i]
                const b = indices[j]
                adjacencyList[a].push(b)
                adjacencyList[b].push(a)
            }
        }
    }

    const visited = new Array<boolean>(numberOfFeatures).fill(false)
    let connectedComponents = 0

    for (let index = 0; index < numberOfFeatures; index++) {
        if (!visited[index]) {
            dfs(index, adjacencyList, visited)
            connectedComponents++
        }
    }

    return connectedComponents
}

/**
 * Depth-first search to mark all reachable nodes from the given index.
 * @param index - The current node index to start DFS from.
 * @param adjacencyList - The adjacency list representing the graph.
 * @param visited - An array to keep track of visited nodes.
 */
function dfs(index: number, adjacencyList: number[][], visited: boolean[]): void {
    visited[index] = true

    for (const neighbor of adjacencyList[index]) {
        if (!visited[neighbor]) {
            dfs(neighbor, adjacencyList, visited)
        }
    }
}

function coordinateKey(position: Position): string {
    return `${position[0]},${position[1]}`
}
