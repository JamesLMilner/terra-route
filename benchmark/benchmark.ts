
import { Position } from 'geojson';
import { pointNetworkPairs } from './data/points';
import { getRouteNetworkFromFile, shuffleArray, timesFaster } from './create-benchmark';
import { registeredBenchmarks } from './registered-benchmarks';
import { renderBarChart } from './ascii-chart';

const benchmark = ({
    networkPath,
    pairs,
    shuffle = false,
    chart = true
}: {
    networkPath: string,
    pairs: [Position, Position][],
    shuffle?: boolean,
    chart?: boolean
}) => {

    // Shuffle the input point pairs to ensure the order is not particularly important
    if (shuffle) {
        shuffleArray(pairs);
    }

    const network = getRouteNetworkFromFile(networkPath);
    const benchmarks = registeredBenchmarks(network, pairs);

    const benchmarksInitializeSorted = [...benchmarks].sort((a, b) => {
        return a.initialize.timeTakenMilliseconds - b.initialize.timeTakenMilliseconds
    })

    const benchmarksRoutingSorted = [...benchmarks].sort((a, b) => {
        return a.routing.timeTakenMilliseconds - b.routing.timeTakenMilliseconds
    })

    console.log('===== GRAPH NETWORK INITIALIZING PERFORMANCE =====');
    for (let i = 0; i < benchmarks.length; i++) {
        const bench = benchmarks[i];

        console.log(`${bench.name} took ${bench.initialize.timeTakenMilliseconds}ms to initialize`)
    }

    const fastestInitialised = benchmarksInitializeSorted[0];
    const slowestInitialized = benchmarksInitializeSorted[benchmarksInitializeSorted.length - 1];

    console.log('');
    console.log(`Fastest: ${fastestInitialised.name} which took ${fastestInitialised.initialize.timeTakenMilliseconds}ms`)

    if (benchmarksInitializeSorted.length > 1) {
        const timesFasterInitialization = timesFaster(fastestInitialised.initialize.timeTakenMilliseconds, slowestInitialized.initialize.timeTakenMilliseconds)
        console.log(`${fastestInitialised.name} is x${timesFasterInitialization} faster than ${slowestInitialized.name} for initialization`);

        console.log('');
    }

    console.log('===== GRAPH ROUTING PERFORMANCE =====');
    for (let i = 0; i < benchmarks.length; i++) {
        const bench = benchmarks[i];

        console.log(`${bench.name} took ${bench.routing.timeTakenMilliseconds}ms to route ${pairs.length} point pairs`)
    }

    const fastestRouting = benchmarksRoutingSorted[0];
    const slowestRouting = benchmarksRoutingSorted[benchmarksRoutingSorted.length - 1];

    console.log('');
    console.log(`Fastest: ${fastestRouting.name} which took ${fastestRouting.routing.timeTakenMilliseconds}ms`)

    if (benchmarksRoutingSorted.length > 1) {
        const timesFasterRouting = timesFaster(fastestRouting.routing.timeTakenMilliseconds, slowestRouting.routing.timeTakenMilliseconds)
        console.log(`${fastestRouting.name} is x${timesFasterRouting} faster than ${slowestRouting.name} for routing`);
    }


    chart && renderBarChart(benchmarksRoutingSorted.map((bench) => ({
        label: bench.name,
        value: bench.routing.timeTakenMilliseconds,
    })));
}

benchmark({
    networkPath: 'benchmark/data/network.json',
    pairs: pointNetworkPairs,
    shuffle: true
});