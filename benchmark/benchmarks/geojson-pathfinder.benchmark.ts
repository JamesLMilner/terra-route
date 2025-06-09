import { FeatureCollection, LineString, Position, Feature, Point } from "geojson";
import { createRoutingBenchmark } from "../create-benchmark";

// GeoJSON Path Finder
import GeoJSONPathFinder from "geojson-path-finder";

const PathFinder = (GeoJSONPathFinder as any).default;
const pathToGeoJSON = (GeoJSONPathFinder as any).pathToGeoJSON;

type BenchmarkProps = {
    network: FeatureCollection<LineString>,
    pairs: Position[][],
    enabled?: boolean
}


export const CreateGeoJSONPathFinderBenchmark = ({
    network,
    pairs,
    enabled
}: BenchmarkProps) => createRoutingBenchmark(
    'GeoJSON Path Finder',
    () => {
        return new PathFinder(network)
    },
    (pathFinder) => {
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i]
            const result = pathFinder.findPath(
                { type: "Feature", geometry: { type: "Point", coordinates: pair[0] } } as Feature<Point>,
                { type: "Feature", geometry: { type: "Point", coordinates: pair[1] } } as Feature<Point>
            )

            // To keep things fair we also convert the path to GeoJSON
            if (result?.path && result?.path.length > 1) {
                pathToGeoJSON(result)
            }
        }
    },
    enabled
)
