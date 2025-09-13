import { FeatureCollection, LineString, Position } from 'geojson';
import { haversineDistance } from '../../distance/haversine';
import { KDBush } from './spatial-index/kdbush';
import { around } from './spatial-index/geokdbush';

export function unifyCloseCoordinates(
    featureCollection: FeatureCollection<LineString>,
    radiusMeters: number
): FeatureCollection<LineString> {
    if (featureCollection.features.length < 2) {
        return featureCollection; // No features to process
    }

    const globalSeen: Position[] = [];
    const globalSeenSet = new Set<string>(); // Fast O(1) lookup for globalSeen
    const mapping: Map<string, Position> = new Map();

    // Build a one-time spatial index with all coordinates for efficient querying
    const allCoords: Position[] = [];
    const coordToGlobalIndex = new Map<string, number>();

    // Collect all unique coordinates first
    for (const feature of featureCollection.features) {
        for (const coord of feature.geometry.coordinates) {
            const key = `${coord[0]},${coord[1]}`; // Faster than join
            if (!coordToGlobalIndex.has(key)) {
                coordToGlobalIndex.set(key, allCoords.length);
                allCoords.push(coord);
            }
        }
    }

    // Build spatial index once for all coordinates
    let spatialIndex: KDBush = new KDBush(allCoords.length);
    for (const coord of allCoords) {
        spatialIndex.add(coord[0], coord[1]); // lng, lat
    }
    spatialIndex.finish();

    function findOrRegisterCoordinate(
        coordinate: Position,
        exclude: Position[],
        futureConflictCheck: Set<string>
    ): Position {
        let closest: Position | null = null;
        let closestDistance = Infinity;

        // if (globalSeen.length > 5) {
        // Use spatial index for efficient querying
        const radiusKm = radiusMeters / 1000; // Convert meters to kilometers
        const candidateIndices = around(spatialIndex, coordinate[0], coordinate[1], Infinity, radiusKm);

        for (const candidateIndex of candidateIndices) {
            const candidateCoord = allCoords[candidateIndex];
            const candidateKey = `${candidateCoord[0]},${candidateCoord[1]}`;

            // Only consider coordinates that are in globalSeen (O(1) lookup)
            if (!globalSeenSet.has(candidateKey)) {
                continue;
            }

            if (exclude.includes(candidateCoord)) {
                continue;
            }

            if (futureConflictCheck.has(candidateKey)) {
                continue;
            }

            const distance = haversineDistance(candidateCoord, coordinate) * 1000; // Convert to meters

            if (distance <= radiusMeters && distance < closestDistance) {
                closest = candidateCoord;
                closestDistance = distance;
            }
        }


        if (closest !== null) {
            return closest;
        }

        globalSeen.push(coordinate);
        globalSeenSet.add(`${coordinate[0]},${coordinate[1]}`);
        return coordinate;
    }

    const updatedFeatures = featureCollection.features.map((feature) => {
        const localSeen: Position[] = [];
        const updatedCoordinates: Position[] = [];
        const usedKeys = new Set<string>();

        for (const coordinate of feature.geometry.coordinates) {
            const key = `${coordinate[0]},${coordinate[1]}`;

            if (!mapping.has(key)) {
                const unified = findOrRegisterCoordinate(coordinate, localSeen, usedKeys);
                const unifiedKey = `${unified[0]},${unified[1]}`;

                // Avoid inserting a coordinate if it's going to cause duplication later in this feature
                if (usedKeys.has(unifiedKey)) {
                    mapping.set(key, coordinate);
                } else {
                    mapping.set(key, unified);
                }
            }

            const unifiedCoordinate = mapping.get(key)!;
            const unifiedKey = `${unifiedCoordinate[0]},${unifiedCoordinate[1]}`;

            if (!usedKeys.has(unifiedKey)) {
                updatedCoordinates.push(unifiedCoordinate);
                usedKeys.add(unifiedKey);
            }

            localSeen.push(coordinate);
        }

        return {
            ...feature,
            geometry: {
                ...feature.geometry,
                coordinates: updatedCoordinates
            }
        };
    });

    return {
        ...featureCollection,
        features: updatedFeatures
    };
}
