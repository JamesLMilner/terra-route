<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/logo-dark-mode.png">
  <source media="(prefers-color-scheme: light)" srcset="./assets/logo.png">
  <img alt="Terra Draw logo" src="./assets/logo.png" width="400px">
</picture>

<p></p>

Terra Route aims to be a fast library for routing on GeoJSON LineStrings networks, where LineStrings share identical coordinates. 

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

Terra Route provides a utility called LineStringGraph for analyzing GeoJSON route networks. This class is especially useful for debugging, as it includes methods to identify unique nodes, edges, and connected components, along with their counts. Beyond debugging, these methods help you programmatically explore and understand the structure of your graph — for example, by measuring its size and examining how its parts are connected.

```typescript
const graph = new LineStringGraph(network);

// Return all nodes in the graph as FeatureCollection<Point>, where each unique node is a Feature<Point>
const graphPoints = graph.getNodes();

// Return all the unique edges as FeatureCollection<LineString>, where each unique edge is a Feature<LineString>
const graphEdges = graph.getEdges(); 
```

## Benchmarks

The benchmarks make use of a series out route example route networks from OSM in a moderate sized section of East London. It runs against the GeoJSON Path Finder library and also the ngraph.graph library. You can run the benchmarks yourself using:

```
npm run benchmark
```

Here is an example output of a benchmark run for routing:

<pre>
Terra Route          | ██████ 186ms
GeoJSON Path Finder  | ██████████████████ 566ms
ngraph.graph         | ██████████████████████████████████████████████████ 1577ms
</pre>

Using default Haversine distance, Terra Route is approximately 3x faster than GeoJSON Path Finder with Haversine distance for A -> B path finding. If you pass in the CheapRuler distance metric (you can use the exposed `createCheapRuler` function), it is approximately x8 faster than GeoJSON Path Finder with Haversine distance. 

For initialisation of the network, Terra Route is approximately 10x faster with Haversine than GeoJSON Path Finder. Terra Draw splits out instantiating the Class of the library from the actual graph building, which is done via `buildRouteGraph`. This allows you to defer graph creation to an appropriate time.

Terra Route uses an [A* algorthm for pathfinding](https://en.wikipedia.org/wiki/A*_search_algorithm) and by default uses a [four-ary heap](https://en.wikipedia.org/wiki/D-ary_heap) for the underlying priority queue, although this is configurable. 

## Limitations

- Terra Route does not currently support weighting functions.
- Coordinates must be identical to be considered connected

## Acknowledgements

Terra Route is inspired by the the prior art of [geojson-path-finder](https://github.com/perliedman/geojson-path-finder/) and we use this library to help benchmark Terra Routes performance. 

## License

MIT