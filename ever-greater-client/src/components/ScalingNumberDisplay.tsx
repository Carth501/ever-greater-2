import { JSX } from "react";
import ScalingNumber from "../classes/ScalingNumber";
import "./ScalingNumberDisplay.css";

interface Props {
  scalingNumber: ScalingNumber;
  scientific?: boolean;
  handleScientificToggle?: () => void;
  debugMode?: boolean;
}

function ScalingNumberDisplay({
  scalingNumber,
  scientific = true,
  handleScientificToggle,
  debugMode = false,
}: Props): JSX.Element {
  return (
    <div className="box scaling-number-display">
      <h1>
        <strong>Ticket Pool:</strong>{" "}
        {scientific
          ? scalingNumber.toString(true)
          : scalingNumber.toFormattedString()}
      </h1>
      <div>
        <input
          type="checkbox"
          id="scientific"
          name="scientific"
          checked={scientific}
          onChange={handleScientificToggle}
        />
        <label htmlFor="scientific">Force Scientific Notation</label>
      </div>
      {debugMode && (
        <div>
          <strong>Raw Array:</strong> [{scalingNumber.getDigits().join(", ")}]
          {/* For debugging purposes. Note: This does not include leading zeros */}
        </div>
      )}
    </div>
  );
}

export default ScalingNumberDisplay;
