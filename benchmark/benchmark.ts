/* eslint-disable no-console */

import { Position } from 'geojson';
import { pointNetworkPairs } from './data/points';
import { Benchmark, getRouteNetworkFromFile, shuffleArray, timesFaster } from './create-benchmark';
import { registeredBenchmarks } from './registered-benchmarks';
import { renderBarChart } from './ascii-chart';

const benchmark = ({
    benchmarks,
    pairs,
    shuffle = false,
    chart = true
}: {
    benchmarks: Benchmark[],
    pairs: [Position, Position][],
    shuffle?: boolean,
    chart?: boolean
}) => {
    if (pairs.length === 0) {
        console.error('No point pairs provided for benchmarking.');
        return;
    }

    if (benchmarks.length === 0) {
        console.error('No benchmarks were registered. Please check your network and pairs.');
        return;
    }

    // Shuffle the input point pairs to ensure the order is not particularly important
    if (shuffle) {
        shuffleArray(pairs);
    }

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
    }

    chart && renderBarChart(benchmarksInitializeSorted.map((bench) => ({
        label: bench.name,
        value: bench.initialize.timeTakenMilliseconds,
    })));

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


// Setup
const networkPath = './benchmark/data/network.json'
const network = getRouteNetworkFromFile(networkPath)
const benchmarks = registeredBenchmarks(network, pointNetworkPairs)

// Run the benchmarks
benchmark({
    benchmarks,
    pairs: pointNetworkPairs,
    shuffle: true,
});