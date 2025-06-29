import { Feature, FeatureCollection, LineString, Point, Position } from 'geojson'

/**
 * Counts the unique nodes and edges in a GeoJSON FeatureCollection of LineString features.
 * @param featureCollection - A GeoJSON FeatureCollection containing LineString features
 * @returns An object containing the count of unique nodes and edges
 */
export function graphGetNodeAndEdgeCount(
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


/**
 * Converts a FeatureCollection of LineString features into a FeatureCollection of Point features,
 * where each unique coordinate in the LineStrings becomes a Point.
 * @param lines - A GeoJSON FeatureCollection containing LineString features
 * @returns A FeatureCollection of Point features representing unique nodes
 */
export function graphGetNodesAsPoints(lines: FeatureCollection<LineString>): Feature<Point>[] {
    const seen = new Set<string>();
    const points: Feature<Point>[] = [];

    for (const feature of lines.features) {
        for (const coord of feature.geometry.coordinates) {
            const key = coord.join(',');

            if (!seen.has(key)) {
                seen.add(key);
                points.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: coord
                    },
                    properties: {}
                });
            }
        }
    }

    return points;
}
