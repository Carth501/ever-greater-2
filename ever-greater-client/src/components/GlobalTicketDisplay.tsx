import { JSX } from "react";
import "./GlobalTicketDisplay.css";

interface Props {
  scalingNumber: number;
  scientific?: boolean;
  handleScientificToggle?: () => void;
  debugMode?: boolean;
}

function GlobalTicketDisplay({
  scalingNumber,
  scientific = true,
  handleScientificToggle,
  debugMode = false,
}: Props): JSX.Element {
  return (
    <div className="box global-ticket-display">
      <h1>
        <strong>Ticket Pool:</strong>{" "}
        {scientific
          ? scalingNumber.toExponential(2)
          : scalingNumber.toLocaleString()}
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
          <strong>Raw Array:</strong> [
          {scalingNumber.toString().split("").join(", ")}]
          {/* For debugging purposes. Note: This does not include leading zeros */}
        </div>
      )}
    </div>
  );
}

export default GlobalTicketDisplay;
