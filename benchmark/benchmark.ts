
import { Feature, FeatureCollection, LineString, Point, Position } from 'geojson';
import { readFileSync } from 'fs';
import GeoJSONPathFinder from "geojson-path-finder";
import { pointNetworkPairs } from './points';
import { shuffleArray } from './shuffle';
import TerraRoute from '../src/terra-route';
import { createCheapRuler } from '../src/distance/cheap-ruler';

const PathFinder = (GeoJSONPathFinder as any).default;
const pathToGeoJSON = (GeoJSONPathFinder as any).pathToGeoJSON;

const benchmark = (networkPath: string, pairs: [Position, Position][]) => {
    const network = readFileSync(networkPath, 'utf-8');
    const networkParsed = JSON.parse(network) as FeatureCollection<LineString>;

    const rulerDistance = createCheapRuler(networkParsed.features[0].geometry.coordinates[0][1]);

    const terraRoute = new TerraRoute(networkParsed);
    const terraRouteWithCheapRuler = new TerraRoute(networkParsed, (positionA, positionB) => rulerDistance(positionA, positionB));
    const pathFinder = new PathFinder(networkParsed)

    const startTimeCheapRuler = Date.now();
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i]
        terraRouteWithCheapRuler.getRoute(
            { type: "Feature", geometry: { type: "Point", coordinates: pair[0] } } as Feature<Point>,
            { type: "Feature", geometry: { type: "Point", coordinates: pair[1] } } as Feature<Point>
        )
    }
    const endTimeCheapRuler = Date.now();
    console.log(`TerraRoute with CheapRuler took ${endTimeCheapRuler - startTimeCheapRuler}ms for ${pairs.length} pairs`);


    const startTime = Date.now();
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i]
        terraRoute.getRoute(
            { type: "Feature", geometry: { type: "Point", coordinates: pair[0] } } as Feature<Point>,
            { type: "Feature", geometry: { type: "Point", coordinates: pair[1] } } as Feature<Point>
        )
    }
    const endTime = Date.now();
    console.log(`TerraRoute took ${endTime - startTime}ms for ${pairs.length} pairs`);

    const startTimePathFinder = Date.now();
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
    const endTimePathFinder = Date.now();

    console.log(`PathFinder took ${endTimePathFinder - startTimePathFinder}ms for ${pairs.length} pairs`);

    console.log('')

    // Percentage difference of how much faster or slower TerraRoute is than PathFinder.
    // Here a lower times are better 
    const percentageDifference = ((endTimePathFinder - startTimePathFinder) - (endTime - startTime)) / (endTimePathFinder - startTimePathFinder) * 100;
    console.log(`TerraRoute with Haversine is ${percentageDifference.toFixed(2)}% ${percentageDifference > 0 ? 'faster' : 'slower'} than PathFinder`);

    // Percentage difference of how much faster or slower TerraRoute is than PathFinder.
    // Here a lower times are better 
    const percentageDifferenceWithCheapRuler = ((endTimePathFinder - startTimePathFinder) - (endTimeCheapRuler - startTimeCheapRuler)) / (endTimePathFinder - startTimePathFinder) * 100;
    console.log(`TerraRoute with CheapRuler is ${percentageDifferenceWithCheapRuler.toFixed(2)}% ${percentageDifferenceWithCheapRuler > 0 ? 'faster' : 'slower'} than PathFinder`);
}

benchmark('benchmark/data/network.json', shuffleArray(pointNetworkPairs));