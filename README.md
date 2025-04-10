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

You can run the benchmarks yourself using:

```
npm run benchmark
```

Using default Haversine distance, Terra Route is approximately 3x faster than GeoJSON Path Finder with Haversine distance. If you pass in the CheapRuler distance metric (you can use the exposed `createCheapRuler` function), it is about 5x faster. 

## Limitations

Terra Route does not currently support weighting functions.

## Acknowledgements

Terra Route is inspired by the the prior art of [geojson-path-finder](https://github.com/perliedman/geojson-path-finder/) and we use this library to help benchmark Terra Routes performance. 

## License

MIT