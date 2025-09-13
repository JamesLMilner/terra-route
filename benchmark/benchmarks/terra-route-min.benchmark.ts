import { Feature, Point } from "geojson";
import { createRoutingBenchmark } from "./../create-benchmark";

// Terra Route
import { TerraRoute } from "../../src/terra-route";
import { BenchmarkProps } from "../registered-benchmarks";
import { MinHeap } from "../../src/heap/min-heap";

export const CreateTerraRouteMinHeapBenchmark = ({
    network,
    pairs,
    enabled
}: BenchmarkProps) => createRoutingBenchmark(
    'Terra Route with Min Heap',
    () => {
        const terraRoute = new TerraRoute({ heap: MinHeap });
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
