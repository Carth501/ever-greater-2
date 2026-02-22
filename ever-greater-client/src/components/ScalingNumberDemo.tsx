import { JSX, useEffect, useState } from "react";
import {
  connectGlobalCountSocket,
  fetchGlobalCount,
  incrementGlobalCount,
} from "../api/globalTicket";
import GlobalTicketDisplay from "./GlobalTicketDisplay";

function ScalingNumberDemo(): JSX.Element {
  const [scalingNumber, setScalingNumber] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [scientific, setScientific] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  const handleAdd = () => {
    try {
      setError("Debug add is disabled in server mode.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSubtract = () => {
    try {
      setError("Debug subtract is disabled in server mode.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === "" || /^[0-9]+$/.test(value)) {
      setInputValue(value);
      setError("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  const handleScientificToggle = (setting: boolean) => {
    setScientific(setting);
  };

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
      <div className="scaling-number-display">
        <GlobalTicketDisplay
          scalingNumber={scalingNumber}
          scientific={scientific}
          handleScientificToggle={() => handleScientificToggle(!scientific)}
        ></GlobalTicketDisplay>
      </div>
      <div className="debug-mode-toggle">
        <label>
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          />
          Debug Mode
        </label>
      </div>

      <div className="demo-controls">
        <button onClick={() => increment()} className="demo-button">
          Increment
        </button>

        {debugMode && (
          <>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter a number"
              className="demo-input"
            />
            <button onClick={handleAdd} className="demo-button">
              Add
            </button>
            <button onClick={handleSubtract} className="demo-button">
              Subtract
            </button>
          </>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default ScalingNumberDemo;
