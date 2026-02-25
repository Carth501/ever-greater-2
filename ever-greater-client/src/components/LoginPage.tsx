import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginThunk } from "../store/slices/authSlice";
import "./AuthPage.css";

type LoginPageProps = {
  onSwitchToSignup: () => void;
};

export default function LoginPage({ onSwitchToSignup }: LoginPageProps) {
  const dispatch = useAppDispatch();
  const { isLoading, error: authError } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError("");

    if (!email || !password) {
      setLocalError("Email and password are required");
      return;
    }

    dispatch(
      loginThunk({
        email,
        password,
      }),
    );
  }

  const displayError = authError || localError;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login</h1>

        {displayError && <div className="auth-error">{displayError}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="switch-button"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
