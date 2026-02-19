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
      <div>
        <strong>Value:</strong> {scalingNumber.toString(true)}
      </div>
      <div>
        <strong>Raw Array:</strong> [{scalingNumber.getDigits().join(", ")}]
      </div>
    </div>
  );
}

export default ScalingNumberDisplay;
