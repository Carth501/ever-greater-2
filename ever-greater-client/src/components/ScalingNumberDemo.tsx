import { JSX, useEffect, useState } from "react";
import type { User } from "../api/auth";
import {
  connectGlobalCountSocket,
  fetchGlobalCount,
  incrementGlobalCount,
} from "../api/globalTicket";
import GlobalTicketDisplay from "./GlobalTicketDisplay";
import "./ScalingNumberDemo.css";

type ScalingNumberDemoProps = {
  onLogout: () => void;
  currentUser: User;
};

function ScalingNumberDemo({
  onLogout,
  currentUser,
}: ScalingNumberDemoProps): JSX.Element {
  const [scalingNumber, setScalingNumber] = useState(0);
  const [error, setError] = useState("");

  const increment = async () => {
    try {
      setError("");
      const count = await incrementGlobalCount();
      setScalingNumber(count);
    } catch (err) {
      setError((err as Error).message || "Failed to increment");
    }
  };

  useEffect(() => {
    let isMounted = true;

    fetchGlobalCount()
      .then((count) => {
        if (isMounted) {
          setScalingNumber(count);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError((err as Error).message || "Failed to fetch count");
        }
      });

    const disconnect = connectGlobalCountSocket(
      (count) => {
        setScalingNumber(count);
      },
      (status) => {
        if (status === "error") {
          setError("WebSocket connection error");
        }
      },
    );

    return () => {
      isMounted = false;
      disconnect();
    };
  }, []);

  return (
    <div className="scaling-number-demo">
      <div className="user-header">
        <div className="user-info">
          <span className="user-email">{currentUser.email}</span>
          <span className="user-contributed">
            Tickets contributed: {currentUser.tickets_contributed}
          </span>
        </div>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="scaling-number-display">
        <GlobalTicketDisplay
          scalingNumber={scalingNumber}
        ></GlobalTicketDisplay>
      </div>

      <div className="demo-controls">
        <button onClick={() => increment()} className="demo-button">
          Print a ticket
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default ScalingNumberDemo;
