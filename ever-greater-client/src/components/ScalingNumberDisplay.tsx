import { JSX } from "react";
import ScalingNumber from "../classes/ScalingNumber";

interface Props {
  scalingNumber: ScalingNumber;
  label?: string;
}

function ScalingNumberDisplay({ scalingNumber, label }: Props): JSX.Element {
  return (
    <div className="scaling-number-display">
      {label && <label>{label}</label>}
      <div>{scalingNumber.getValue()}</div>
    </div>
  );
}

export default ScalingNumberDisplay;
