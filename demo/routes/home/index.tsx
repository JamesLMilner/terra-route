import { h } from "preact";
import style from "./style.module.css";
import {
  useRef,
  useEffect,
  useState,
} from "preact/hooks";
import { setupLeafletMap } from "./setup-leaflet";
import * as L from "leaflet";
import { FeatureCollection, LineString } from "geojson";
import { LineStringGraph } from "../../../src/graph/graph";

const Home = () => {
  const lat = 51.536583;
  const lng = -0.07600000;
  const mapOptions = {
    L,
    id: "leaflet-map",
    lng,
    lat,
    zoom: 16,
    minZoom: 14,
    maxZoom: 19,
    tapTolerance: 10
  };
  const ref = useRef(null);
  const [map, setMap] = useState<undefined | L.Map>();
  // const [mode, setMode] = useState<string>("static");
  const [network, setNetwork] = useState<FeatureCollection<LineString>>();

  const [info, setInfo] = useState({
    nodes: 0,
    edges: 0,
    connectedComponents: 0,
    longestEdge: 0,
    shortestEdge: 0,
  })

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const path = isLocalhost ? '/public/network.json' : './network.json';

    fetch(path).then((res) => {
      res.json().then((network) => {
        setNetwork(network);
      });
    });
  }, []);

  useEffect(() => {
    if (map && network) {
      // Add a geojson layer to the map
      L.geoJSON(network, {
        style: {
          color: '#3388ff',
          weight: 2,
          opacity: 0.6,
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindTooltip(feature.properties.name, {
              permanent: true,
              direction: 'top',
              className: 'leaflet-tooltip',
            });
          }
        }
      }).addTo(map);

      const graph = new LineStringGraph(network)

      setInfo({
        nodes: graph.getNodeCount(),
        edges: graph.getEdgeCount(),
        connectedComponents: graph.getConnectedComponentCount(),
        longestEdge: graph.getLongestEdgeLength(),
        shortestEdge: graph.getShortestEdgeLength(),
      })

      const shortestEdge = graph.getShortestEdge();

      console.log('Shortest Edge:', shortestEdge);

      if (shortestEdge) {
        L.geoJSON(shortestEdge, {
          style: {
            //dark green
            color: '#00ff00',
            weight: 5,
            opacity: 1,
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.name) {
              layer.bindTooltip(feature.properties.name, {
                permanent: true,
                direction: 'top',
                className: 'leaflet-tooltip',
              });
            }
          }
        }).addTo(map);
      }

      const longestEdge = graph.getLongestEdge()

      if (longestEdge) {
        L.geoJSON(longestEdge, {
          style: {
            // red
            color: '#ff0000',
            weight: 5,
            opacity: 1,
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.name) {
              layer.bindTooltip(feature.properties.name, {
                permanent: true,
                direction: 'top',
                className: 'leaflet-tooltip',
              });
            }
          }
        }).addTo(map);
      }

    }
  }, [map, network]);

  useEffect(() => {
    if (!map) {
      setMap(setupLeafletMap(mapOptions));
    }
  }, []);


  return (
    <div class={style.home}>
      <div ref={ref} class={style.map} id={mapOptions.id}>
        <div class={style.info}>
          <p><strong>Connected Components</strong>: {info.connectedComponents}</p>
          <p><strong>Edges</strong>: {info.edges}</p>
          <p><strong>Nodes</strong>: {info.nodes}</p>
          <p><strong>Longest edge (m)</strong>: {(info.longestEdge * 1000).toFixed(2)}</p>
          <p><strong>Shortest edge (m)</strong>: {(info.shortestEdge * 1000).toFixed(2)}</p>

        </div>
        {!network || !map ? <div class={style.loading}>Loading...</div> : null}
      </div>
    </div>
  );
};

export default Home;
