import { FeatureCollection, LineString, Position, Feature, Point } from "geojson";
import { createRoutingBenchmark } from "./create-benchmark";

// ngraph
import { aStar } from "ngraph.path";
import createGraph from "ngraph.graph";

// Terra Route
import { TerraRoute, createCheapRuler, haversineDistance } from "../src/terra-route";

// GeoJSON Path Finder
import GeoJSONPathFinder from "geojson-path-finder";
const PathFinder = (GeoJSONPathFinder as any).default;
const pathToGeoJSON = (GeoJSONPathFinder as any).pathToGeoJSON;

export const registeredBenchmarks = (network: FeatureCollection<LineString>, pairs: Position[][]) => [
    createRoutingBenchmark(
        'TerraRoute',
        () => {
            const terraRoute = new TerraRoute();
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
        }
    ),
    createRoutingBenchmark(
        'TerraRoute with CheapRuler',
        () => {
            const rulerDistance = createCheapRuler(network.features[0].geometry.coordinates[0][1]);
            const terraRouteWithCheapRuler = new TerraRoute((positionA, positionB) => rulerDistance(positionA, positionB));
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
        }
    ),
    createRoutingBenchmark(
        'GeoJSON Path Finder',
        () => {
            return new PathFinder(network)
        },
        (pathFinder) => {
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
        }
    ),
    createRoutingBenchmark(
        'ngraph.graph',
        () => {
            const graph = createGraph();

            network.features.forEach(feature => {
                const coords = feature.geometry.coordinates;
                for (let i = 0; i < coords.length - 1; i++) {
                    const from = coords[i].join(',');
                    const to = coords[i + 1].join(',');
                    graph.addLink(from, to, { weight: haversineDistance(coords[i], coords[i + 1]) });
                }
            });

            const pathFinder = aStar(graph, {
                distance(_fromNode: any, _toNode: any, link: any) {
                    return link.data.weight;
                }
            });

            return pathFinder;

        },
        (pathFinder) => {
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i]
                pathFinder.find(pair[0].join(','), pair[1].join(','))
            }
        }
    )
].filter((benchmark) => benchmark !== null);
