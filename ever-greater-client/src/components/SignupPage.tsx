import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { signupThunk } from "../store/slices/authSlice";
import "./AuthPage.css";

type SignupPageProps = {
  onSwitchToLogin: () => void;
};

export default function SignupPage({ onSwitchToLogin }: SignupPageProps) {
  const dispatch = useAppDispatch();
  const { isLoading, error: authError } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters long");
      return;
    }

    dispatch(
      signupThunk({
        email,
        password,
      }),
    );
  }

  const displayError = authError || localError;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>

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
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="switch-button"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
