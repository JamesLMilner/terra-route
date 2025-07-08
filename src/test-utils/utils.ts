import { Position, Feature, Point, LineString, FeatureCollection } from "geojson";
import { haversineDistance } from "../distance/haversine";

/**
 * Calculates the total length of a LineString route in meters.
 *
 * @param line - A GeoJSON Feature<LineString> representing the route
 * @returns The total length of the route in meters
 */
export function routeLength(
    line: Feature<LineString>,
) {
    const lineCoords = line.geometry.coordinates;

    // Calculate the total route distance
    let routeDistance = 0;
    for (let i = 0; i < lineCoords.length - 1; i++) {
        routeDistance += haversineDistance(lineCoords[i], lineCoords[i + 1]);
    }
    return routeDistance
}

/**
 * Extracts unique coordinates from a FeatureCollection of LineStrings.
 *
 * @param collection - A GeoJSON FeatureCollection of LineStrings
 * @returns An array of unique Position coordinates
 */
export function getUniqueCoordinatesFromLineStrings(
    collection: FeatureCollection<LineString>
): Position[] {
    const seen = new Set<string>();
    const unique: Position[] = [];

    for (const feature of collection.features) {
        if (feature.geometry.type !== "LineString") {
            continue;
        }

        for (const coord of feature.geometry.coordinates) {
            const key = `${coord[0]},${coord[1]}`;

            if (!seen.has(key)) {
                seen.add(key);
                unique.push(coord);
            }
        }
    }

    return unique;
}

/**
 * Validates a GeoJSON Feature<LineString> route.
 *
 * @param route - The GeoJSON feature to validate
 * @returns A boolean indicating if it is a valid LineString route
 */
export function getReasonIfLineStringInvalid(
    route: Feature<LineString> | null | undefined
): string | undefined {
    // 1. Must exist
    if (!route) {
        return 'No feature';
    }

    // 2. Must be a Feature
    if (route.type !== "Feature") {
        return 'Not a Feature';
    }

    // 3. Must have a geometry of type LineString
    if (!route.geometry || route.geometry.type !== "LineString") {
        return 'Not a LineString';
    }

    // 4. Coordinates must be an array with length >= 2
    const coords = route.geometry.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
        return `Not enough coordinates: ${coords.length} (${coords})`;
    }

    const seen = new Set<string>();

    // 5. Validate each coordinate is a valid Position
    //    (At minimum, [number, number] or [number, number, number])
    for (const position of coords) {
        if (!Array.isArray(position)) {
            return 'Not a Position; not an array';
        }

        // Check numeric values, ignoring optional altitude
        if (
            position.length < 2 ||
            typeof position[0] !== "number" ||
            typeof position[1] !== "number"
        ) {
            return 'Not a Position; elements are not a numbers';
        }

        // 6. Check for duplicates
        const key = `${position[0]},${position[1]}`;
        if (seen.has(key)) {
            return `Duplicate coordinate: ${key}`;
        }
        seen.add(key);
    }
}

/**
 * Checks if the start and end coordinates of a LineString match the given start and end points.
 * 
 * @param line - The LineString feature to check
 * @param start - The start point feature
 * @param end - The end point feature
 * @return True if the start and end coordinates match, false otherwise
 * */
export function startAndEndAreCorrect(line: Feature<LineString>, start: Feature<Point>, end: Feature<Point>): boolean {
    const lineCoords = line.geometry.coordinates;
    const startCoords = start.geometry.coordinates;
    const endCoords = end.geometry.coordinates;

    // Check if the first coordinate of the LineString matches the start point
    const startMatches = lineCoords[0][0] === startCoords[0] && lineCoords[0][1] === startCoords[1];

    // Check if the last coordinate of the LineString matches the end point
    const endMatches = lineCoords[lineCoords.length - 1][0] === endCoords[0] && lineCoords[lineCoords.length - 1][1] === endCoords[1];

    return startMatches && endMatches;
}

/**
 * Checks if the route represented by a LineString is longer than the direct path. 
 * In theory, a route should always longer than the direct path if it has more than two points.
 * @param line - The LineString feature representing the route
 * @param start - The start point feature
 * @param end - The end point feature
 * @returns - True if the route is longer than the direct path, false otherwise
 */
export function routeIsLongerThanDirectPath(line: Feature<LineString>, start: Feature<Point>, end: Feature<Point>): boolean {
    const lineCoords = line.geometry.coordinates;
    const startCoords = start.geometry.coordinates;
    const endCoords = end.geometry.coordinates;

    if (lineCoords.length <= 2) {
        return true;
    }

    // Calculate the direct distance between the start and end points
    const directDistance = haversineDistance(startCoords, endCoords);

    // Calculate the route distance
    let routeDistance = 0;
    for (let i = 0; i < lineCoords.length - 1; i++) {
        routeDistance += haversineDistance(lineCoords[i], lineCoords[i + 1]);
    }

    // If the route distance is 0, it means the start and end points are the same
    if (routeDistance === 0) {
        return true;
    }

    if (routeDistance < directDistance) {

        // Check if the route distance is very close to the direct distance
        const absoluteDifference = Math.abs(routeDistance - directDistance);
        if (absoluteDifference < 0.000000000001) {
            return true;
        }

        return false;
    }

    return true
}

/**
 * Modifies a FeatureCollection of LineStrings to break connections
 * between lines that share coordinates, by adjusting one of the shared
 * coordinates within a given tolerance.
 * 
 * @param collection - The input FeatureCollection of LineStrings
 * @param tolerance - The amount by which to offset shared coordinates (in degrees)
 * @returns A new FeatureCollection with modified coordinates
 */
export function disconnectLineStrings(
    collection: FeatureCollection<LineString>,
    tolerance: number
): FeatureCollection<LineString> {
    const seenCoordinates = new Map<string, number>()

    function getCoordinateKey(coordinate: Position): string {
        return `${coordinate[0]},${coordinate[1]}`
    }

    function offsetCoordinate(coordinate: Position, count: number): Position {
        const offset = count * tolerance
        return [coordinate[0] + offset, coordinate[1] + offset]
    }

    const updatedFeatures = collection.features.map((feature) => {
        const updatedCoordinates: Position[] = feature.geometry.coordinates.map((coordinate) => {
            const key = getCoordinateKey(coordinate)

            if (seenCoordinates.has(key)) {
                const count = seenCoordinates.get(key)!
                seenCoordinates.set(key, count + 1)
                return offsetCoordinate(coordinate, count + 1)
            }

            seenCoordinates.set(key, 0)
            return coordinate
        })

        return {
            ...feature,
            geometry: {
                ...feature.geometry,
                coordinates: updatedCoordinates
            }
        }
    })

    return {
        ...collection,
        features: updatedFeatures
    }
}
