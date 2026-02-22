import { JSX } from "react";
import "./GlobalTicketDisplay.css";

interface Props {
  scalingNumber: number;
}

function GlobalTicketDisplay({ scalingNumber }: Props): JSX.Element {
  return (
    <div className="box global-ticket-display">
      <h1>
        <strong>Ticket Pool:</strong> {scalingNumber.toLocaleString()}
      </h1>
    </div>
  );
}

export default GlobalTicketDisplay;
