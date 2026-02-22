import { JSX, useState } from "react";
import GlobalTicketDisplay from "./GlobalTicketDisplay";

function ScalingNumberDemo(): JSX.Element {
  const [scalingNumber, setScalingNumber] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [scientific, setScientific] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  const handleAdd = () => {
    try {
      setError("");
      if (!inputValue.trim()) {
        setError("Please enter a number");
        return;
      }
      const numToAdd = Math.floor(parseFloat(inputValue));
      const result = scalingNumber + numToAdd;
      setScalingNumber(result);
      setInputValue("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSubtract = () => {
    try {
      setError("");
      if (!inputValue.trim()) {
        setError("Please enter a number");
        return;
      }
      const numToSubtract = Math.floor(parseFloat(inputValue));
      const result = scalingNumber - numToSubtract;
      setScalingNumber(result);
      setInputValue("");
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

  const increment = () => {
    const result = scalingNumber + 1;
    setScalingNumber(result);
  };

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
