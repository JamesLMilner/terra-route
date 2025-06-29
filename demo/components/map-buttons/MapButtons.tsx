import MapButton from "../map-button/MapButton";
import ClearButton from "../map-button/ClearButton";
import { h } from "preact";
import style from "./style.module.css";

const MapButtons = ({
  mode,
  onClear,
  changeMode,
}: {
  mode: string;
  changeMode: (mode: string) => void;
  onClear: () => void;
}) => {
  return (
    <div class={style.buttons}>
      <MapButton
        label={"Route Snap"}
        mode={"routesnap"}
        currentMode={mode}
        changeMode={changeMode}
      />
      <ClearButton onClick={onClear} label='Clear' />
    </div>
  );
};

export default MapButtons;
