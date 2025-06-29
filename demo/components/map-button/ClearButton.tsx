import { h } from "preact";
import style from "./style.module.css";

const ClearButton = ({
  label,
  onClick,
}: {
  onClick: () => void;
  label?: string;
}) => {
  return (
    <button
      id={'clear'}
      class={style.button}
      onClick={() => {
        onClick()
      }}
    >
      {label}
    </button>
  );
};

export default ClearButton;
