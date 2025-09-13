import { Feature, Point } from "geojson";
import { createRoutingBenchmark } from "./../create-benchmark";

// Terra Route
import { TerraRoute } from "../../src/terra-route";
import { BenchmarkProps } from "../registered-benchmarks";

export const CreateTerraRouteBenchmark = ({
    network,
    pairs,
    enabled
}: BenchmarkProps) => createRoutingBenchmark(
    'Terra Route',
    () => {
        const terraRoute = new TerraRoute();
        terraRoute.buildRouteGraph(network);
        return terraRoute
    },
    (terraRoute) => {
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i]
            terraRoute.getRoute(
                { type: "Feature", geometry: { type: "Point", coordinates: pair[0] } } as Feature<Point>,
                { type: "Feature", geometry: { type: "Point", coordinates: pair[1] } } as Feature<Point>
            )
        }
    },
    enabled
)
