# Terra Route

Terra Route aims to be a fast library for routing on GeoJSON LineStrings networks, where LineStrings share identical coordinates. Terra Routes main aim is currently performance - it uses bidirectional A* to help achieve this.

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

// Sample GeoJSON network (a simple "L" shape)
const network: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [0, 0],   // A
          [0, 1],   // B
          [0, 2],   // C
        ],
      },
      properties: {},
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [0, 1],   // B
          [1, 1],   // D
        ],
      },
      properties: {},
    },
  ],
};

// Define start and end points (A and D)
const startPoint: Feature<Point> = {
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [0, 0], // Point A
  },
  properties: {},
};

const endPoint: Feature<Point> = {
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [1, 1], // Point D
  },
  properties: {},
};

// Initialize TerraRoute instance
const router = new TerraRoute();

// We must build the route graph first before calling getRoute
router.buildRouteGraph(network);

// Get shortest route
const route = router.getRoute(startPoint, endPoint);

console.log("Shortest route:", JSON.stringify(route, null, 2));
```

## Benchmarks

The benchmarks make use of a series out route example route networks from OSM in a moderate sized section of East London. It runs against the GeoJSON Path Finder library and also the ngraph.graph library. You can run the benchmarks yourself using:

```
npm run benchmark
```

Here is an example output of a benchmark run for routing:

<pre>
Terra Route with CheapRuler | █ 26ms
Terra Route                 | ██ 42ms
GeoJSON Path Finder        | █████████████████████████ 609ms
ngraph.graph               | ██████████████████████████████████████████████████ 1227ms
</pre>

Using default Haversine distance, Terra Route is approximately 13x faster than GeoJSON Path Finder with Haversine distance for A -> B path finding. If you pass in the CheapRuler distance metric (you can use the exposed `createCheapRuler` function), it is about 22x faster. 

For initialisation of the network, Terra Route is about 9x faster with Haversine and 14x faster with CheapRuler than GeoJSON Path Finder. Terra Draw splits out instantiating the Class of the library from the actual graph building, which is done via `buildRouteGraph`. This allows you to defer graph creation to an appropriate time.

## Limitations

Terra Route does not currently support weighting functions.

## Acknowledgements

Terra Route is inspired by the the prior art of [geojson-path-finder](https://github.com/perliedman/geojson-path-finder/) and we use this library to help benchmark Terra Routes performance. 

## License

MIT