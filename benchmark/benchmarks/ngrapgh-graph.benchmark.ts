import { LineString, Feature } from "geojson";
import { createRoutingBenchmark } from "./../create-benchmark";

// ngraph
import { aStar } from "ngraph.path";
import createGraph from "ngraph.graph";

// Terra Route
import { haversineDistance } from "../../src/terra-route";
import { BenchmarkProps } from "../registered-benchmarks";


export const CreateNgraphGraphBenchmark = ({
    network,
    pairs,
    enabled
}: BenchmarkProps) => createRoutingBenchmark(
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
            const route = pathFinder.find(pair[0].join(','), pair[1].join(','));
            const coordinates = route.map((node: any) => node.id.split(',').map(Number));
            const feature: Feature<LineString> = {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates
                },
                properties: {}
            };
        }
    },
    enabled
);