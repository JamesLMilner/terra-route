# Terra Route

Terra Route aims to be a performant library for routing on GeoJSON LineStrings, where LineStrings share identical coordinates. Terra Routes main aim is performance.

## Install

```
npm install terra-route
```

## Example

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

// Initialize TerraRoute
const router = new TerraRoute(network);

// Get shortest route
const route = router.getRoute(startPoint, endPoint);

console.log("Shortest route:", JSON.stringify(route, null, 2));
```

## Acknowledgements

Terra Route is inspired by the the prior art of [geojson-path-finder](https://github.com/perliedman/geojson-path-finder/) and we use this library to help benchmark Terra Routes performance. 

## License

MIT