import { LineString, Position, FeatureCollection } from "geojson";
import { readFileSync } from "fs";

// Helper function to generate a random existing point from a random linestring
function randomExistingPoint(lineStrings: LineString[]): Position {
    const line = lineStrings[Math.floor(Math.random() * lineStrings.length)];
    const coords = line.coordinates;

    if (coords.length === 0) throw new Error("Linestring must have at least 1 coordinate");

    return coords[Math.floor(Math.random() * coords.length)];
}

// Function to generate random paired points from a FeatureCollection of LineStrings 
function generateRandomPairedPoints(
    input: FeatureCollection<LineString>,
    count: number
): [Position, Position][] {
    if (input.features.length === 0) {
        throw new Error("Input FeatureCollection has no LineStrings.");
    }

    const lineStrings = input.features.map(feature => feature.geometry);

    const pairs: [Position, Position][] = [];

    for (let i = 0; i < count; i++) {
        const start = randomExistingPoint(lineStrings);
        const end = randomExistingPoint(lineStrings);

        pairs.push([
            start,
            end
        ]);
    }

    return pairs;
}

const network = readFileSync('./data/network.json', 'utf-8');
const networkParsed = JSON.parse(network) as FeatureCollection<LineString>;
const points = generateRandomPairedPoints(networkParsed, 100);

console.log(points);
