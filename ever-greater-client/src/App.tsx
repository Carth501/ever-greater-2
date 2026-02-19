import { useState } from "react";
import "./App.css";
import ScalingNumber from "./classes/ScalingNumber";
import ScalingNumberDisplay from "./components/ScalingNumberDisplay";

function App() {
  const [scalingNumber, setScalingNumber] = useState(new ScalingNumber(0));

  const handleIncrement = () => {
    const newNumber = new ScalingNumber(scalingNumber.getValue());
    newNumber.increment();
    setScalingNumber(newNumber);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>ScalingNumber Demo</h1>
        <ScalingNumberDisplay scalingNumber={scalingNumber} />
        <button onClick={handleIncrement}>Increment</button>
      </header>
    </div>
  );
}

export default App;
