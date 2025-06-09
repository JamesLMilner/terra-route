import { Feature, Point } from "geojson";
import { createRoutingBenchmark } from "./../create-benchmark";


// Terra Route
import { TerraRoute, createCheapRuler } from "../../src/terra-route";

import { BenchmarkProps } from "../registered-benchmarks";

export const CreateTerraRouteCheapRulerBenchmark = ({
    network,
    pairs,
    enabled
}: BenchmarkProps) => createRoutingBenchmark(
    'Terra Route with CheapRuler',
    () => {
        const rulerDistance = createCheapRuler(network.features[0].geometry.coordinates[0][1]);
        const terraRouteWithCheapRuler = new TerraRoute({ distanceMeasurement: (positionA, positionB) => rulerDistance(positionA, positionB) });
        terraRouteWithCheapRuler.buildRouteGraph(network);
        return terraRouteWithCheapRuler
    },
    (terraRouteWithCheapRuler) => {
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i]
            terraRouteWithCheapRuler.getRoute(
                { type: "Feature", geometry: { type: "Point", coordinates: pair[0] } } as Feature<Point>,
                { type: "Feature", geometry: { type: "Point", coordinates: pair[1] } } as Feature<Point>
            )
        }
    },
    enabled
)