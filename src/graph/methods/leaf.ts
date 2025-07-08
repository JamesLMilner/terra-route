import { FeatureCollection, LineString, Feature } from 'geojson';
import { graphGetUniqueSegments } from './unique';

/**
 * Separates a graph's edges into leaf and non-leaf edges.
 * A leaf edge has a start or end node with degree 1.
 *
 * @param edgesFc - FeatureCollection containing LineString features representing edges of a graph
 * @returns Object containing two FeatureCollections: leafEdges and nonLeafEdges
 */
export function getLeafEdges(
    edgesFc: FeatureCollection<LineString>
): {
    leafEdges: FeatureCollection<LineString>;
    nonLeafEdges: FeatureCollection<LineString>;
} {
    const edges = graphGetUniqueSegments(edgesFc);

    const endpointCountMap: Map<string, number> = new Map();

    function coordKey(position: number[]): string {
        return position.join(",");
    }

    // Count the degree (number of edge endpoints) for each coordinate
    for (let i = 0; i < edges.features.length; i++) {
        const feature = edges.features[i];
        const coordinates = feature.geometry.coordinates;

        if (coordinates.length < 2) {
            continue;
        }

        const startKey = coordKey(coordinates[0]);
        const endKey = coordKey(coordinates[coordinates.length - 1]);

        endpointCountMap.set(
            startKey,
            (endpointCountMap.get(startKey) || 0) + 1
        );
        endpointCountMap.set(
            endKey,
            (endpointCountMap.get(endKey) || 0) + 1
        );
    }

    const leafEdgeMap: Map<string, Feature<LineString>> = new Map();
    const nonLeafEdgeMap: Map<string, Feature<LineString>> = new Map();

    for (let i = 0; i < edges.features.length; i++) {
        const feature = edges.features[i];
        const coordinates = feature.geometry.coordinates;

        if (coordinates.length < 2) {
            continue;
        }

        const startKey = coordKey(coordinates[0]);
        const endKey = coordKey(coordinates[coordinates.length - 1]);

        const startCount = endpointCountMap.get(startKey) || 0;
        const endCount = endpointCountMap.get(endKey) || 0;

        const edgeKey = coordinates.map(coordKey).join(";");

        if (startCount === 1 || endCount === 1) {
            if (!leafEdgeMap.has(edgeKey)) {
                leafEdgeMap.set(edgeKey, feature);
            }
        } else {
            if (!nonLeafEdgeMap.has(edgeKey)) {
                nonLeafEdgeMap.set(edgeKey, feature);
            }
        }
    }

    return {
        leafEdges: {
            type: "FeatureCollection",
            features: Array.from(leafEdgeMap.values())
        },
        nonLeafEdges: {
            type: "FeatureCollection",
            features: Array.from(nonLeafEdgeMap.values())
        }
    };
}

