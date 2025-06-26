import { Position, Feature, Point, LineString, FeatureCollection } from "geojson";

/**
 * Creates a GeoJSON Point feature from a coordinate.
 * @param coord - A coordinate in the form of [longitude, latitude]
 * @returns A GeoJSON Feature<Point> object
 */
export const createPointFeature = (coord: Position): Feature<Point> => ({
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: coord,
    },
    properties: {},
});

/**
 * Creates a GeoJSON LineString feature from an array of coordinates.
 * @param coordinates - An array of coordinates in the form of [longitude, latitude]
 * @returns A GeoJSON Feature<LineString> object
 */
export const createLineStringFeature = (coordinates: Position[]): Feature<LineString> => ({
    type: "Feature",
    geometry: {
        type: "LineString",
        coordinates,
    },
    properties: {},
});

/**
 * Creates a GeoJSON FeatureCollection from an array of features.
 * @param features - An array of GeoJSON Feature<LineString> objects
 * @returns A GeoJSON FeatureCollection object
 */
export const createFeatureCollection = (features: Feature<LineString>[]): FeatureCollection<LineString> => ({
    type: "FeatureCollection",
    features,
});
