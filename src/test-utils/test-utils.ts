import { Position, Feature, Point, LineString, FeatureCollection } from "geojson";

export const createPointFeature = (coord: Position): Feature<Point> => ({
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: coord,
    },
    properties: {},
});

export const createFeatureCollection = (features: Feature<LineString>[]): FeatureCollection<LineString> => ({
    type: "FeatureCollection",
    features,
});

export const createLineStringFeature = (coordinates: Position[]): Feature<LineString> => ({
    type: "Feature",
    geometry: {
        type: "LineString",
        coordinates,
    },
    properties: {},
});
