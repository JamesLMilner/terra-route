import { h } from "preact";
import style from "./style.module.css";
import { useMemo } from "preact/hooks";
import { GeoJSONStoreFeatures } from "../../node_modules/terra-draw/dist/store/store";

const GeoJSONTab = ({ features }: { features: GeoJSONStoreFeatures[] }) => {
  // Create a FeatureCollection when features changes
  const featureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features,
    }),
    [features]
  );

  // Turn it into a string so it can be rendered,
  // again only when features change
  const featureCollectionString = useMemo(() => {
    return JSON.stringify(featureCollection, null, 4);
  }, [featureCollection]);

  return (
    <div class={style.container}>
      <textarea class={style.geojson}>
        {featureCollectionString}
      </textarea>
    </div>
  );
};

export default GeoJSONTab;
