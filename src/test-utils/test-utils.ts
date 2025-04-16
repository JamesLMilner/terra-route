import { Position, Feature, Point, LineString, FeatureCollection } from "geojson";
import { haversineDistance } from "../terra-route";

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

export function generateGridWithDiagonals(n: number, spacing: number): FeatureCollection<LineString> {
    const features: Feature<LineString>[] = [];

    const coord = (x: number, y: number): Position => [x * spacing, y * spacing];

    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            // Horizontal edge (to the right)
            if (x < n - 1) {
                features.push({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            coord(x, y),
                            coord(x + 1, y)
                        ]
                    },
                    properties: {}
                });
            }

            // Vertical edge (upward)
            if (y < n - 1) {
                features.push({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            coord(x, y),
                            coord(x, y + 1)
                        ]
                    },
                    properties: {}
                });
            }

            // Diagonal bottom-left to top-right
            if (x < n - 1 && y < n - 1) {
                features.push({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            coord(x, y),
                            coord(x + 1, y + 1)
                        ]
                    },
                    properties: {}
                });
            }

            // Diagonal bottom-right to top-left
            if (x > 0 && y < n - 1) {
                features.push({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            coord(x, y),
                            coord(x - 1, y + 1)
                        ]
                    },
                    properties: {}
                });
            }
        }
    }

    return {
        type: "FeatureCollection",
        features
    };
}

/**
 * Generate a star-like polygon with n vertices.
 * If connectAll is true, connects every vertex to every other (complete graph).
 * If false, connects only the outer ring to form a polygon perimeter.
 *
 * @param n - Number of vertices (>= 3)
 * @param radius - Radius in degrees for placing vertices in a circle
 * @param center - Center of the polygon [lng, lat]
 * @param connectAll - If true, connects every pair of vertices. If false, only connects the outer ring.
 * @returns FeatureCollection of LineStrings
 */
export function generateStarPolygon(
    n: number,
    radius = 0.01,
    center: Position = [0, 0],
    connectAll = true
): FeatureCollection<LineString> {
    if (n < 3) {
        throw new Error("Star polygon requires at least 3 vertices.");
    }

    const angleStep = (2 * Math.PI) / n;
    const vertices: Position[] = [];

    // Generate points in a circle
    for (let i = 0; i < n; i++) {
        const angle = i * angleStep;
        const x = center[0] + radius * Math.cos(angle);
        const y = center[1] + radius * Math.sin(angle);
        vertices.push([x, y]);
    }

    const features: Feature<LineString>[] = [];

    if (connectAll) {
        // Connect every vertex to every other vertex
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                features.push({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [vertices[i], vertices[j]],
                    },
                    properties: {},
                });
            }
        }
    } else {
        // Connect outer ring only
        for (let i = 0; i < n; i++) {
            const next = (i + 1) % n;
            features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [vertices[i], vertices[next]],
                },
                properties: {},
            });
        }
    }

    return {
        type: "FeatureCollection",
        features,
    };
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
 * Generate a spatial n-depth tree as a FeatureCollection<LineString>.
 *
 * @param depth - Number of depth levels (>= 1)
 * @param branchingFactor - Number of children per node
 * @param root - Root position [lng, lat]
 * @param length - Distance between each parent and child
 * @returns FeatureCollection of LineStrings representing the tree
 */
export function generateTreeFeatureCollection(
    depth: number,
    branchingFactor: number,
    root: Position = [0, 0],
    length = 0.01
): FeatureCollection<LineString> {
    if (depth < 1) {
        throw new Error("Tree must have at least depth 1.");
    }

    const features: Feature<LineString>[] = [];

    interface TreeNode {
        position: Position;
        level: number;
    }

    const nodes: TreeNode[] = [{ position: root, level: 0 }];

    const RAD = Math.PI / 180;

    for (let level = 0; level < depth; level++) {
        const newNodes: TreeNode[] = [];

        for (const node of nodes.filter(n => n.level === level)) {
            const angleStart = -90 - ((branchingFactor - 1) * 20) / 2;

            for (let i = 0; i < branchingFactor; i++) {
                const angle = angleStart + i * 20; // spread branches 20 degrees apart
                const radians = angle * RAD;

                const dx = length * Math.cos(radians);
                const dy = length * Math.sin(radians);

                const child: Position = [node.position[0] + dx, node.position[1] + dy];

                features.push({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [node.position, child],
                    },
                    properties: {},
                });

                newNodes.push({ position: child, level: level + 1 });
            }
        }

        nodes.push(...newNodes);
    }

    return {
        type: "FeatureCollection",
        features,
    };
}

/**
* Generates a connected graph of concentric rings, each ring fully connected
* around itself and connected radially to the next ring.
*
* @param numRings - Number of concentric rings
* @param pointsPerRing - How many points (nodes) on each ring
* @param spacing - Distance between consecutive rings
* @param center - [lng, lat] center of the rings
* @returns A FeatureCollection of LineStrings for the rings + radial connections
*/
export function generateConcentricRings(
    numRings: number,
    pointsPerRing: number,
    spacing: number,
    center: Position = [0, 0]
): FeatureCollection<LineString> {
    // Holds all the ring coordinates: ringPoints[i][j] => coordinate
    const ringPoints: Position[][] = [];

    // Create ring points
    for (let i = 0; i < numRings; i++) {
        const ringRadius = (i + 1) * spacing;
        const ring: Position[] = [];

        for (let j = 0; j < pointsPerRing; j++) {
            const angle = (2 * Math.PI * j) / pointsPerRing;
            const x = center[0] + ringRadius * Math.cos(angle);
            const y = center[1] + ringRadius * Math.sin(angle);
            ring.push([x, y]);
        }

        ringPoints.push(ring);
    }

    // Build the graph as a collection of LineStrings
    const features: Feature<LineString>[] = [];

    // 1. Add each ring as a closed loop
    for (let i = 0; i < numRings; i++) {
        const coords = ringPoints[i];
        // Close the ring by appending the first point again
        const ringWithClosure = [...coords, coords[0]];

        features.push({
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: ringWithClosure,
            },
        });
    }

    // 2. Connect rings radially
    // (i.e., ring i node j to ring i+1 node j)
    for (let i = 0; i < numRings - 1; i++) {
        for (let j = 0; j < pointsPerRing; j++) {
            const start = ringPoints[i][j];
            const end = ringPoints[i + 1][j];

            features.push({
                type: "Feature",
                properties: {},
                geometry: {
                    type: "LineString",
                    coordinates: [start, end],
                },
            });
        }
    }

    return {
        type: "FeatureCollection",
        features,
    };
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
export function startAndEndAreCorrect(line: Feature<LineString>, start: Feature<Point>, end: Feature<Point>) {
    const lineCoords = line.geometry.coordinates;
    const startCoords = start.geometry.coordinates;
    const endCoords = end.geometry.coordinates;

    // Check if the first coordinate of the LineString matches the start point
    const startMatches = lineCoords[0][0] === startCoords[0] && lineCoords[0][1] === startCoords[1];

    // Check if the last coordinate of the LineString matches the end point
    const endMatches = lineCoords[lineCoords.length - 1][0] === endCoords[0] && lineCoords[lineCoords.length - 1][1] === endCoords[1];

    return startMatches && endMatches;
}

export function routeIsLongerThanDirectPath(line: Feature<LineString>, start: Feature<Point>, end: Feature<Point>) {
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