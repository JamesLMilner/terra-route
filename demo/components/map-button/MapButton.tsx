import { h } from "preact";
import style from "./style.module.css";
import { titleCase } from "../../utils/casing";

const MapButton = ({
  mode,
  currentMode,
  changeMode,
  label,
  hiddenOnTouch,
}: {
  mode: string;
  currentMode: string;
  changeMode: (mode: string) => void;
  label?: string;
  hiddenOnTouch?: boolean;
}) => {
  let classes = style.button;

  if (hiddenOnTouch) {
    classes = `${style.hiddenOnMobile} ${classes}`;
  }

  if (currentMode === mode) {
    classes = `${style.active} ${classes}`;
  }

  return (
    <button
      id={mode}
      class={classes}
      onClick={() => {
        changeMode(mode);
      }}
    >
      {label ? label : titleCase(mode)}
    </button>
  );
};

export default MapButton;
