import { JSX } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutThunk } from "../store/slices/authSlice";
import { incrementCountThunk } from "../store/slices/ticketSlice";
import GlobalTicketDisplay from "./GlobalTicketDisplay";
import "./ScalingNumberDemo.css";

type ScalingNumberDemoProps = {
  onLogout: () => void;
};

function ScalingNumberDemo({ onLogout }: ScalingNumberDemoProps): JSX.Element {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const {
    count: scalingNumber,
    error,
    isLoading,
  } = useAppSelector((state) => state.ticket);

  const handleIncrement = () => {
    dispatch(incrementCountThunk());
  };

  const handleLogout = () => {
    dispatch(logoutThunk());
    onLogout();
  };

  if (!currentUser) {
    return <div>Loading user data...</div>;
  }

  const supplies = currentUser.printer_supplies ?? 0;
  const isOutOfSupplies = supplies === 0;
  const isButtonDisabled = isLoading || isOutOfSupplies;

  return (
    <div className="scaling-number-demo">
      <div className="user-header">
        <div className="user-info">
          <span className="user-email">{currentUser.email}</span>
          <span className="user-contributed">
            Tickets contributed: {currentUser.tickets_contributed}
          </span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="scaling-number-display">
        <GlobalTicketDisplay
          scalingNumber={scalingNumber}
        ></GlobalTicketDisplay>
      </div>

      <div className="demo-controls">
        <button
          onClick={handleIncrement}
          className="demo-button"
          disabled={isButtonDisabled}
        >
          {isLoading
            ? "Printing..."
            : isOutOfSupplies
              ? "Out of Supplies"
              : "Print a ticket"}
        </button>
        <div
          className={`supplies-count ${isOutOfSupplies ? "supplies-depleted" : ""}`}
        >
          <span className="supplies-label">Supplies:</span>
          <span className="supplies-value">{supplies}</span>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default ScalingNumberDemo;
