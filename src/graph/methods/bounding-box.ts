import { Feature, FeatureCollection, LineString, Position } from 'geojson'

/**
 * Type representing a bounding box as [minLng, minLat, maxLng, maxLat]
 */
export type BoundingBox = [number, number, number, number]

/**
 * Filters a FeatureCollection of LineString features to only include LineStrings 
 * that are completely within the specified bounding box.
 * @param featureCollection - A GeoJSON FeatureCollection containing LineString features
 * @param boundingBox - A bounding box array in the format [minLng, minLat, maxLng, maxLat]
 * @returns A new FeatureCollection<LineString> containing only the LineStrings completely within the bounding box
 */
export function getNetworkInBoundingBox(
    featureCollection: FeatureCollection<LineString>,
    boundingBox: BoundingBox
): FeatureCollection<LineString> {
    const [minLng, minLat, maxLng, maxLat] = boundingBox

    // Validate bounding box
    if (minLng >= maxLng || minLat >= maxLat) {
        throw new Error('Invalid bounding box: min values must be less than max values')
    }

    const filteredFeatures: Feature<LineString>[] = []

    for (const feature of featureCollection.features) {
        if (isLineStringCompletelyWithinBounds(feature, minLng, minLat, maxLng, maxLat)) {
            filteredFeatures.push(feature)
        }
    }

    return {
        type: 'FeatureCollection',
        features: filteredFeatures
    }
}

/**
 * Checks if a LineString feature is completely within the specified bounds.
 * @param lineStringFeature - A GeoJSON Feature<LineString>
 * @param minLng - Minimum longitude
 * @param minLat - Minimum latitude
 * @param maxLng - Maximum longitude
 * @param maxLat - Maximum latitude
 * @returns true if all coordinates of the LineString are within the bounds, false otherwise
 */
function isLineStringCompletelyWithinBounds(
    lineStringFeature: Feature<LineString>,
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number
): boolean {
    const coordinates = lineStringFeature.geometry.coordinates

    for (const coordinate of coordinates) {
        if (!isCoordinateWithinBounds(coordinate, minLng, minLat, maxLng, maxLat)) {
            return false
        }
    }

    return true
}

/**
 * Checks if a coordinate is within the specified bounds.
 * @param coordinate - A coordinate position [lng, lat]
 * @param minLng - Minimum longitude
 * @param minLat - Minimum latitude
 * @param maxLng - Maximum longitude
 * @param maxLat - Maximum latitude
 * @returns true if the coordinate is within the bounds, false otherwise
 */
function isCoordinateWithinBounds(
    coordinate: Position,
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number
): boolean {
    const [lng, lat] = coordinate
    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
}
