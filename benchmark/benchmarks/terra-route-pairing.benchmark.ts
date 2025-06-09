import { Feature, Point } from "geojson";
import { createRoutingBenchmark } from "./../create-benchmark";

// Terra Route
import { TerraRoute } from "../../src/terra-route";
import { PairingHeap } from "../../src/heap/pairing-heap";
import { BenchmarkProps } from "../registered-benchmarks";

export const CreateTerraRoutePairingBenchmark = ({
    network,
    pairs,
    enabled
}: BenchmarkProps) => createRoutingBenchmark(
    'Terra Route with Pairing Heap',
    () => {
        const terraRoute = new TerraRoute({ heap: PairingHeap });
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
