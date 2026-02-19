import { JSX } from "react";
import ScalingNumber from "../classes/ScalingNumber";

interface Props {
  scalingNumber: ScalingNumber;
}

function ScalingNumberDisplay({ scalingNumber }: Props): JSX.Element {
  return (
    <div className="scaling-number-display">{scalingNumber.getValue()}</div>
  );
}

export default ScalingNumberDisplay;
