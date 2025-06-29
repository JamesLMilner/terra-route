import { h } from "preact";
import style from "./style.module.css";
import { getHHMMSS } from "../../utils/dates";
import { area, length } from "../../utils/geo";
import { useMemo } from "preact/hooks";
import { GeoJSONStoreFeatures } from "../../node_modules/terra-draw/dist/store/store";

const InfoTab = ({
  selected,
  features,
}: {
  selected: undefined | GeoJSONStoreFeatures;
  features: GeoJSONStoreFeatures[];
}) => {
  const { points, lines, polygons } = useMemo(() => {
    const points: GeoJSONStoreFeatures[] = [];
    const lines: GeoJSONStoreFeatures[] = [];
    const polygons: GeoJSONStoreFeatures[] = [];
    features.forEach((f) => {
      if (f.geometry.type === "Point") {
        points.push(f);
      }
      if (f.geometry.type === "LineString") {
        lines.push(f);
      }
      if (f.geometry.type === "Polygon") {
        polygons.push(f);
      }
    });

    return { points, lines, polygons };
  }, [features]);

  return (
    <div class={style.container}>
      <div class={style.all}>
        <h3 class={style.header}> All Features </h3>
        <span class={style.row}>
          <span class={style.type}>Total</span> {features.length}
        </span>
        <span class={style.row}>
          <span class={style.type}>Polygons:</span>
          {polygons.length}
        </span>
        <span class={style.row}>
          <span class={style.type}>LineStrings:</span>
          {lines.length}
        </span>
        <span class={style.row}>
          <span class={style.type}>Points:</span>
          {points.length}
        </span>
      </div>
      <div class={style.current}>
        <h3 class={style.header}> Selected Feature </h3>
        <span class={style.row}>
          <span class={style.type}>ID</span>
          {selected ? (selected.id as string).slice(0, 8) + "..." : "N/A"}
        </span>
        <span class={style.row}>
          <span class={style.type}>Geometry Type</span>
          {selected ? selected.geometry.type : "N/A"}
        </span>
        <span class={style.row}>
          <span class={style.type}>Created</span>
          {selected
            ? getHHMMSS(selected.properties.createdAt as number)
            : "N/A"}
        </span>
        <span class={style.row}>
          <span class={style.type}>Updated</span>
          {selected
            ? getHHMMSS(selected.properties.updatedAt as number)
            : "N/A"}
        </span>
        <span class={style.row}>
          <span class={style.type}>Coordinates</span>
          {selected && selected.geometry.type === "Polygon"
            ? selected.geometry.coordinates[0].length
            : selected && selected.geometry.type === "LineString"
              ? selected.geometry.coordinates.length
              : "N/A"}
        </span>
        <span class={style.row}>
          <span class={style.type}>Area (m2)</span>
          {selected && selected.geometry.type === "Polygon"
            ? area(selected).toFixed(2)
            : "N/A"}
        </span>
        <span class={style.row}>
          <span class={style.type}>Length (km)</span>
          {selected && selected.geometry.type === "LineString"
            ? length(selected).toFixed(2)
            : "N/A"}
        </span>
      </div>
    </div>
  );
};

export default InfoTab;
