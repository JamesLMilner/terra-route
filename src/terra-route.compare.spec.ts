import PathFinder, { pathToGeoJSON } from "geojson-path-finder";
import { FeatureCollection, LineString, Position } from "geojson";
import { haversineDistance, TerraRoute } from "./terra-route";
import { routeLength } from "./test-utils/utils";
import { createPointFeature } from "./test-utils/create";

import { readFileSync } from 'fs';


/** Test on a "real" network to ensure that the path is as short or shorter than GeoJSON Path Finder */
describe("TerraRoute", () => {
    describe('getRoute', () => {
        it('matches route create from GeoJSON Path Finder', () => {

            const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;

            const pairs: [Position, Position][] = [];

            // Connect midpoints of lines across the network
            for (let i = 0, j = network.features.length - 1; i < j; i++, j--) {
                const coordsA = network.features[i].geometry.coordinates;
                const coordsB = network.features[j].geometry.coordinates;

                const midA = Math.floor(coordsA.length / 2);
                const midB = Math.floor(coordsB.length / 2);

                pairs.push([
                    coordsA[midA] as Position,
                    coordsB[midB] as Position
                ]);
            }

            // Connect starting and ending points of lines across the network
            for (let i = 0, j = network.features.length - 1; i < j; i++, j--) {
                const coordsA = network.features[i].geometry.coordinates;
                const coordsB = network.features[j].geometry.coordinates;

                pairs.push([
                    coordsA[0] as Position,
                    coordsB[coordsB.length - 1] as Position
                ]);
            }

            const terraRoute = new TerraRoute();

            terraRoute.buildRouteGraph(network as FeatureCollection<LineString>);

            const pathFinder = new PathFinder(network as FeatureCollection<LineString>, {
                // Mimic points having to be identical
                tolerance: 0.000000000000000000001,
                weight: (a, b) => haversineDistance(a, b)
            });

            for (let i = 0; i < pairs.length; i++) {
                // Start and end points are the same
                const startIsEnd = pairs[i][0][0] === pairs[i][1][0] && pairs[i][0][1] === pairs[i][1][1]
                if (startIsEnd) {
                    continue;
                }

                const start = createPointFeature(pairs[i][0]);
                const end = createPointFeature(pairs[i][1]);

                const route = pathFinder.findPath(start, end);
                expect(route).not.toBeNull();

                // Route not found
                if (!route || route.path.length <= 1) {
                    const routeFromTerraRoute = terraRoute.getRoute(start, end);

                    // We want to check terra-route also returns null in this scenario
                    expect(routeFromTerraRoute).toBeNull();
                    continue
                }

                const routeFromPathFinder = pathToGeoJSON(route);
                expect(routeFromPathFinder).toBeDefined();

                const routeFromTerraRoute = terraRoute.getRoute(start, end);
                expect(routeFromTerraRoute).not.toBeNull();

                const pathFinderLength = routeLength(routeFromPathFinder!)
                const terraDrawLength = routeLength(routeFromTerraRoute!);

                expect(pathFinderLength).toBeGreaterThanOrEqual(terraDrawLength);

            }
        });

    })
});
