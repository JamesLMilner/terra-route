import * as leaflet from "leaflet";
import * as protomaps from "protomaps";

export function setupLeafletMap({
  L,
  id,
  lat,
  lng,
  zoom,
  minZoom,
  maxZoom,
  tapTolerance,
  maxBounds
}: {
  L: typeof leaflet;
  id: string;
  lat: number;
  lng: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  tapTolerance: number;
  maxBounds: leaflet.LatLngBoundsExpression | undefined;
}) {
  const leafletMap = L.map(id, {
    center: [lat, lng],
    zoom, // starting zoom,
    minZoom,
    maxZoom,
    tapTolerance,
    maxBounds,
  });

  const PMTILES_KEY = "d23c43b7c56e123d";
  const layer = protomaps.leafletLayer({
    url: `https://api.protomaps.com/tiles/v2/{z}/{x}/{y}.pbf?key=${PMTILES_KEY}`,
  });
  layer.addTo(leafletMap);

  return leafletMap;
}
