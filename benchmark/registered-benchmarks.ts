import { FeatureCollection, LineString, Position } from "geojson";
import { filterDisabledBenchmarks } from "./create-benchmark";
import { CreateTerraRouteBenchmark } from "./benchmarks/terra-route.benchmark";
import { CreateNgraphGraphBenchmark } from "./benchmarks/ngrapgh-graph.benchmark";
import { CreateTerraRouteFibonacciBenchmark } from "./benchmarks/terra-route-fibonacci.benchmark";
import { CreateTerraRoutePairingBenchmark } from "./benchmarks/terra-route-pairing.benchmark";
import { CreateTerraRouteCheapRulerBenchmark } from "./benchmarks/terra-route-cheap-ruler.benchmark";
import { CreateGeoJSONPathFinderBenchmark } from "./benchmarks/geojson-pathfinder.benchmark";
import { CreateTerraRouteMinHeapBenchmark } from "./benchmarks/terra-route-min.benchmark";

export type BenchmarkProps = {
    network: FeatureCollection<LineString>,
    pairs: Position[][],
    enabled?: boolean
}

export const registeredBenchmarks = (network: FeatureCollection<LineString>, pairs: Position[][]) => {
    const parameters = { network, pairs };

    return filterDisabledBenchmarks([
        // Main comparison benchmarks
        CreateTerraRouteBenchmark({ ...parameters, enabled: true }),
        CreateGeoJSONPathFinderBenchmark({ ...parameters, enabled: true }),

        // Others
        CreateTerraRouteCheapRulerBenchmark({ ...parameters, enabled: false }),
        CreateTerraRouteFibonacciBenchmark({ ...parameters, enabled: false }),
        CreateTerraRoutePairingBenchmark({ ...parameters, enabled: false }),
        CreateTerraRouteMinHeapBenchmark({ ...parameters, enabled: false }),
        CreateTerraRouteCheapRulerBenchmark({ ...parameters, enabled: false }),
        CreateNgraphGraphBenchmark({ ...parameters, enabled: false }),
    ])
}
