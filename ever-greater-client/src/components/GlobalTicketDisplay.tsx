import { JSX } from "react";
import "./GlobalTicketDisplay.css";

interface Props {
  scalingNumber: number;
  scientific?: boolean;
}

function GlobalTicketDisplay({
  scalingNumber,
  scientific = true,
}: Props): JSX.Element {
  return (
    <div className="box global-ticket-display">
      <h1>
        <strong>Ticket Pool:</strong>{" "}
        {scientific
          ? scalingNumber.toExponential(2)
          : scalingNumber.toLocaleString()}
      </h1>
    </div>
  );
}

export default GlobalTicketDisplay;
