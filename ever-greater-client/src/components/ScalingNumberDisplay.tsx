import { JSX } from "react";
import ScalingNumber from "../classes/ScalingNumber";

interface Props {
  scalingNumber: ScalingNumber;
  scientific?: boolean;
  handleScientificToggle?: () => void;
}

function ScalingNumberDisplay({
  scalingNumber,
  scientific = true,
  handleScientificToggle,
}: Props): JSX.Element {
  return (
    <div className="scaling-number-display">
      <div>
        <strong>Ticket Pool:</strong> {scalingNumber.toString(scientific)}
      </div>
      <div>
        <input
          type="checkbox"
          id="scientific"
          name="scientific"
          checked={scientific}
          onChange={handleScientificToggle}
        />
        <label htmlFor="scientific">Scientific Notation</label>
      </div>
      <div>
        <strong>Raw Array:</strong> [{scalingNumber.getDigits().join(", ")}]
      </div>
    </div>
  );
}

export default ScalingNumberDisplay;
