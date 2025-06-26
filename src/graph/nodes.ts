import { FeatureCollection, LineString, Position } from 'geojson'

/**
 * Counts the unique nodes and edges in a GeoJSON FeatureCollection of LineString features.
 * @param featureCollection - A GeoJSON FeatureCollection containing LineString features
 * @returns An object containing the count of unique nodes and edges
 */
export function countNodesAndEdges(
    featureCollection: FeatureCollection<LineString>
): { nodeCount: number; edgeCount: number } {
    const nodeSet = new Set<string>()
    const edgeSet = new Set<string>()

    for (const feature of featureCollection.features) {
        const coordinates = feature.geometry.coordinates

        for (const coordinate of coordinates) {
            nodeSet.add(JSON.stringify(coordinate))
        }

        for (let i = 0; i < coordinates.length - 1; i++) {
            const coordinateOne = coordinates[i]
            const coordinateTwo = coordinates[i + 1]

            const edge = normalizeEdge(coordinateOne, coordinateTwo)
            edgeSet.add(edge)
        }
    }

    return {
        nodeCount: nodeSet.size,
        edgeCount: edgeSet.size,
    }
}

function normalizeEdge(coordinateOne: Position, coordinateTwo: Position): string {
    const stringOne = JSON.stringify(coordinateOne)
    const stringTwo = JSON.stringify(coordinateTwo)

    if (stringOne < stringTwo) {
        return `${stringOne}|${stringTwo}`
    }

    return `${stringTwo}|${stringOne}`
}
