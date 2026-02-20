import { JSX, useState } from "react";
import ScalingNumber from "../classes/ScalingNumber";
import ScalingNumberDisplay from "./ScalingNumberDisplay";

function ScalingNumberDemo(): JSX.Element {
  const [scalingNumber, setScalingNumber] = useState(new ScalingNumber(0));
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [scientific, setScientific] = useState(true);

  const handleAdd = () => {
    try {
      setError("");
      if (!inputValue.trim()) {
        setError("Please enter a number");
        return;
      }
      const numToAdd = new ScalingNumber();
      numToAdd.fromString(inputValue);
      const result = scalingNumber.add(numToAdd);
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
      const numToSubtract = new ScalingNumber();
      numToSubtract.fromString(inputValue);
      const result = scalingNumber.subtract(numToSubtract);
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
    const result = scalingNumber.add(new ScalingNumber(1));
    setScalingNumber(result);
  };

  return (
    <div className="scaling-number-demo">
      <ScalingNumberDisplay
        scalingNumber={scalingNumber}
        scientific={scientific}
        handleScientificToggle={() => handleScientificToggle(!scientific)}
      />

      <div className="demo-controls">
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
        <button onClick={() => increment()} className="demo-button">
          Increment
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default ScalingNumberDemo;
