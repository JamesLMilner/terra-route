import { FeatureCollection, LineString, Feature, Position } from "geojson";

/**
 * Generates a grid of LineStrings with n x n nodes, spaced by the given spacing.
 * Each node is connected to its right and upward neighbors, and diagonals are included.
 *
 * @param n - Number of nodes in each dimension (n x n grid)
 * @param spacing - Distance between consecutive nodes
 * @returns FeatureCollection of LineStrings representing the grid
 */
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
