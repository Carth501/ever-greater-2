import "./App.css";
import ScalingNumberDemo from "./components/ScalingNumberDemo";
import cLogo from "./images/cLogo.png";

function App() {
  return (
    <div className="App">
      <ScalingNumberDemo />

      <footer className="App-footer">
        <img src={cLogo} alt="site by C" className="designer-logo" />
      </footer>
    </div>
  );
}

export default App;
