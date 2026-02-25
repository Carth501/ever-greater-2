import { useEffect, useState } from "react";
import "./App.css";
import LoginPage from "./components/LoginPage";
import ScalingNumberDemo from "./components/ScalingNumberDemo";
import SignupPage from "./components/SignupPage";
import cLogo from "./images/cLogo.png";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { checkAuthThunk, logoutThunk } from "./store/slices/authSlice";
import { fetchCountThunk } from "./store/slices/ticketSlice";

type AuthPage = "login" | "signup";

function App() {
  const dispatch = useAppDispatch();
  const { user: currentUser, isCheckingAuth } = useAppSelector(
    (state) => state.auth,
  );
  const [authPage, setAuthPage] = useState<AuthPage>("login");

  // Check if user is already logged in on mount
  useEffect(() => {
    dispatch(checkAuthThunk());
  }, [dispatch]);

  // Fetch initial ticket count when authenticated
  useEffect(() => {
    if (currentUser) {
      dispatch(fetchCountThunk());
    }
  }, [currentUser, dispatch]);

  async function handleLogout() {
    dispatch(logoutThunk());
    setAuthPage("login");
  }

  if (isCheckingAuth) {
    return <div className="App">Loading...</div>;
  }

  if (!currentUser) {
    return (
      <div className="App">
        {authPage === "login" ? (
          <LoginPage onSwitchToSignup={() => setAuthPage("signup")} />
        ) : (
          <SignupPage onSwitchToLogin={() => setAuthPage("login")} />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <ScalingNumberDemo onLogout={handleLogout} />

      <footer className="App-footer">
        <img src={cLogo} alt="site by C" className="designer-logo" />
      </footer>
    </div>
  );
}

export default App;
