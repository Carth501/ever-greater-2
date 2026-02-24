import { useEffect, useState } from "react";
import type { User } from "./api/auth";
import { getCurrentUser, logout } from "./api/auth";
import "./App.css";
import LoginPage from "./components/LoginPage";
import ScalingNumberDemo from "./components/ScalingNumberDemo";
import SignupPage from "./components/SignupPage";
import cLogo from "./images/cLogo.png";

type AuthPage = "login" | "signup";

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authPage, setAuthPage] = useState<AuthPage>("login");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  // Track page visibility for polling
  useEffect(() => {
    function handleVisibilityChange() {
      setIsVisible(!document.hidden);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Refresh user data when visible (every 15 seconds)
  useEffect(() => {
    if (!currentUser || !isVisible) return;

    async function refreshUserData() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    }

    // Initial refresh
    refreshUserData();

    // Set up interval
    const interval = setInterval(refreshUserData, 2000);

    return () => clearInterval(interval);
  }, [currentUser, isVisible]);

  async function handleLogout() {
    try {
      await logout();
      setCurrentUser(null);
      setAuthPage("login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  if (isCheckingAuth) {
    return <div className="App">Loading...</div>;
  }

  if (!currentUser) {
    return (
      <div className="App">
        {authPage === "login" ? (
          <LoginPage
            onLoginSuccess={() => {
              // Refresh user data after login
              getCurrentUser().then(setCurrentUser);
            }}
            onSwitchToSignup={() => setAuthPage("signup")}
          />
        ) : (
          <SignupPage
            onSignupSuccess={() => {
              // Refresh user data after signup
              getCurrentUser().then(setCurrentUser);
            }}
            onSwitchToLogin={() => setAuthPage("login")}
          />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <ScalingNumberDemo onLogout={handleLogout} currentUser={currentUser} />

      <footer className="App-footer">
        <img src={cLogo} alt="site by C" className="designer-logo" />
      </footer>
    </div>
  );
}

export default App;
