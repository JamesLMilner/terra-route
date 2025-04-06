
import { Feature, FeatureCollection, LineString, Point, Position } from 'geojson';
import { readFileSync } from 'fs';
import GeoJSONPathFinder from "geojson-path-finder";
import { pointNetworkPairs } from './points';
import { TerraRoute } from '../src/terra-route';
import { createCheapRuler } from '../src/distance/cheap-ruler';

const PathFinder = (GeoJSONPathFinder as any).default;
const pathToGeoJSON = (GeoJSONPathFinder as any).pathToGeoJSON;


function percentToTimesFaster(terraRouteTime: number, pathFinderTime: number): number {

    const isFaster = terraRouteTime < pathFinderTime;

    const timesFaster = isFaster
        ? pathFinderTime / terraRouteTime
        : terraRouteTime / pathFinderTime;

    return +timesFaster.toFixed(2)
}

const benchmark = (networkPath: string, pairs: [Position, Position][]) => {
    const network = readFileSync(networkPath, 'utf-8');
    const networkParsed = JSON.parse(network) as FeatureCollection<LineString>;

    const startTimeParseNetwork = Date.now();
    const terraRoute = new TerraRoute();
    terraRoute.buildRouteGraph(networkParsed);
    const endTimeParseNetwork = Date.now();
    const terraRouteTime = endTimeParseNetwork - startTimeParseNetwork;
    console.log(`TerraRoute took ${terraRouteTime}ms to parse the network`);

    const startTimeParseNetworkCheapRuler = Date.now();
    const rulerDistance = createCheapRuler(networkParsed.features[0].geometry.coordinates[0][1]);
    const terraRouteWithCheapRuler = new TerraRoute((positionA, positionB) => rulerDistance(positionA, positionB));
    terraRouteWithCheapRuler.buildRouteGraph(networkParsed);
    const endTimeParseNetworkCheapRuler = Date.now();
    console.log(`TerraRoute with CheapRuler took ${endTimeParseNetworkCheapRuler - startTimeParseNetworkCheapRuler}ms to parse the network`);

    const startTimeCreatePathFinder = Date.now();
    const pathFinder = new PathFinder(networkParsed)
    const endTimeCreatePathFinder = Date.now();
    const pathFinderTime = endTimeCreatePathFinder - startTimeCreatePathFinder;
    console.log(`PathFinder took ${pathFinderTime}ms to create the instance`);

    console.log('')


    const percentageDifferenceNetworkBuild = ((pathFinderTime - terraRouteTime) / pathFinderTime) * 100;
    const isFaster = terraRouteTime < pathFinderTime
    const timesFaster = percentToTimesFaster(terraRouteTime, pathFinderTime);
    console.log(`TerraRoute is ${percentageDifferenceNetworkBuild.toFixed(2)}% ${isFaster ? 'faster' : 'slower'} (x${timesFaster.toFixed(2)}) than PathFinder for network parsing`);

    console.log('')

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
    const pathfinderTime = endTimePathFinder - startTimePathFinder

    console.log(`PathFinder took ${pathfinderTime}ms for ${pairs.length} pairs`);

    console.log('')

    // Percentage difference of how much faster or slower TerraRoute is than PathFinder.
    // Here a lower times are better 
    const percentageDifference = ((pathfinderTime) - (endTime - startTime)) / (pathfinderTime) * 100;
    console.log(`TerraRoute with Haversine is ${percentageDifference.toFixed(2)}% ${percentageDifference > 0 ? 'faster' : 'slower'} (x${percentToTimesFaster(endTime - startTime, endTimePathFinder - startTimePathFinder)}) than PathFinder for route finding`);

    // Percentage difference of how much faster or slower TerraRoute is than PathFinder.
    // Here a lower times are better 
    const percentageDifferenceWithCheapRuler = ((pathfinderTime) - (endTimeCheapRuler - startTimeCheapRuler)) / (endTimePathFinder - startTimePathFinder) * 100;
    console.log(`TerraRoute with CheapRuler is ${percentageDifferenceWithCheapRuler.toFixed(2)}% ${percentageDifferenceWithCheapRuler > 0 ? 'faster' : 'slower'} (x${percentToTimesFaster(endTimeCheapRuler - startTimeCheapRuler, endTimePathFinder - startTimePathFinder)
        }) than PathFinder for route finding`);
}

benchmark('benchmark/data/network.json', pointNetworkPairs);