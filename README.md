<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/logo-dark-mode.png">
  <source media="(prefers-color-scheme: light)" srcset="./assets/logo.png">
  <img alt="Terra Draw logo" src="./assets/logo.png" width="400px">
</picture>

<p></p>

Terra Route aims to be a fast library for routing on GeoJSON LineStrings networks, where LineStrings share identical coordinates. Terra Routes main aim is currently performance - it uses A* to help achieve this.

## Install

```
npm install terra-route
```

## Docs 

[API Docs can be found here](https://jameslmilner.github.io/terra-route/)

## Example

Here is a short example of how to use the TerraRoute class:

```typescript
import { FeatureCollection, LineString, Point, Feature } from "geojson";
import { TerraRoute } from "terra-route"; 

// We omit the literal values here in the README for brevity
import { network, startPoint, endPoint } from './network'

// Initialize TerraRoute instance
const router = new TerraRoute();

// network here is a FeatureCollection<LineString> where the all
// identical coordinates are considered connected. 
// We must build the route graph first before calling getRoute.
router.buildRouteGraph(network);

// Get shortest route where startPoint and endpoint are Feature<Point> of 
// a coordinate node which is present on the network (i.e. the coordinate 
// exists in one of the linestrings)
const route = router.getRoute(startPoint, endPoint);

console.log("Shortest route:", JSON.stringify(route, null, 2));
```

## Additional Functionality

Terra Route also exposes functionality for understanding GeoJSON route networks better called `LineStringGraph`. This can be useful for debugging as this class has a series of methods for determining things like unique nodes, edges, connected components as well as all their counts. With this class you can understand your graph better programmatically, for example determining it's size and if it is correctly connected.

```typescript
const graph = new LineStringGraph(network);

// Return all nodes in the graph as FeatureCollection<Point>, where each unique node is a Feature<Point>
const graphPoints = graph.getNodes();

// Return all the unique edges as FeatureCollection<LineString>, where each unique edge is a Feature<LineString>
const graphEdges = graph.getEdges(); 

// The longest possible shortest path in the graph between two nodes (i.e. graph diameter)
const longestShortestPath = graph.getMaxLengthShortestPath()
```

## Benchmarks

The benchmarks make use of a series out route example route networks from OSM in a moderate sized section of East London. It runs against the GeoJSON Path Finder library and also the ngraph.graph library. You can run the benchmarks yourself using:

```
npm run benchmark
```

Here is an example output of a benchmark run for routing:

<pre>
Terra Route         | ███████████ 270ms
GeoJSON Path Finder | █████████████████████████ 591ms
ngraph.graph        | ██████████████████████████████████████████████████ 1177ms
</pre>

Using default Haversine distance, Terra Route is approximately 2x faster than GeoJSON Path Finder with Haversine distance for A -> B path finding. If you pass in the CheapRuler distance metric (you can use the exposed `createCheapRuler` function), it is approximately x5 faster than GeoJSON Path Finder with Haversine distance. 

For initialisation of the network, Terra Route is approximately 10x faster with Haversine than GeoJSON Path Finder. Terra Draw splits out instantiating the Class of the library from the actual graph building, which is done via `buildRouteGraph`. This allows you to defer graph creation to an appropriate time.

## Limitations

- Terra Route does not currently support weighting functions.
- Coordinates must be identical to be considered connected

## Acknowledgements

Terra Route is inspired by the the prior art of [geojson-path-finder](https://github.com/perliedman/geojson-path-finder/) and we use this library to help benchmark Terra Routes performance. 

## License

MIT