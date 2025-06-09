import { FeatureCollection, LineString } from "geojson";
import { readFileSync } from 'fs'

type TimeTaken = { timeTakenMilliseconds: number }

export type Benchmark = {
    name: string;
    initialize: TimeTaken;
    routing: TimeTaken;
}

export const createRoutingBenchmark = <T>(name: string, initialize: () => T, routing: (instance: T) => void, enabled: boolean = true): Benchmark | null => {
    if (!enabled) {
        return null
    }

    const startTimeInitialize = Date.now();
    const result = initialize();
    const endTimeInitialize = Date.now();

    const startTimeRouting = Date.now();
    for (let i = 0; i < 3; i++) {
        routing(result)
    }
    const endTimeRouting = Date.now();

    return {
        name,
        initialize: {
            timeTakenMilliseconds: endTimeInitialize - startTimeInitialize
        },
        routing: {
            timeTakenMilliseconds: endTimeRouting - startTimeRouting
        }
    }
}

export const getRouteNetworkFromFile = (networkFilePath: string): FeatureCollection<LineString> => {
    const network = readFileSync(networkFilePath, 'utf-8');
    const networkParsed = JSON.parse(network) as FeatureCollection<LineString>;

    return networkParsed
}

export function timesFaster(timeA: number, timeB: number): number {
    const isFaster = timeA < timeB;

    const timesFaster = isFaster
        ? timeB / timeA
        : timeA / timeB;

    return +timesFaster.toFixed(2)
}


export const shuffleArray = <T>(array: T[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const filterDisabledBenchmarks = (benchmarks: (Benchmark | null)[]) => {
    return benchmarks.filter((benchmark) => benchmark !== null);
}