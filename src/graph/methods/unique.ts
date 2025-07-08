import {
    Feature,
    FeatureCollection,
    LineString,
    Position
} from 'geojson';

/**
 * Normalize a segment so that [A, B] is equal to [B, A]
 */
function normalizeSegment(start: Position, end: Position): [Position, Position] {
    const [aLat, aLng] = start;
    const [bLat, bLng] = end;

    if (
        aLat < bLat ||
        (aLat === bLat && aLng <= bLng)
    ) {
        return [start, end];
    }

    return [end, start];
}

/**
 * Convert a pair of Positions to a string key for deduplication
 */
function segmentKey(start: Position, end: Position): string {
    const [normalizedStart, normalizedEnd] = normalizeSegment(start, end);
    return JSON.stringify([normalizedStart, normalizedEnd]);
}

/**
 * Breaks LineStrings in a FeatureCollection into unique single line segments
 */
export function graphGetUniqueSegments(
    input: FeatureCollection<LineString>
): FeatureCollection<LineString> {
    const uniqueSegments = new Map<string, Feature<LineString>>();

    for (const feature of input.features) {
        const coordinates = feature.geometry.coordinates;

        for (let index = 0; index < coordinates.length - 1; index++) {
            const start = coordinates[index];
            const end = coordinates[index + 1];

            const key = segmentKey(start, end);

            if (!uniqueSegments.has(key)) {
                const segment: Feature<LineString> = {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [start, end]
                    },
                    properties: {}
                };

                uniqueSegments.set(key, segment);
            }
        }
    }

    return {
        type: 'FeatureCollection',
        features: Array.from(uniqueSegments.values())
    };
}
