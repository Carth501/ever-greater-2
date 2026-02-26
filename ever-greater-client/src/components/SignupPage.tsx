import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { signupThunk } from "../store/slices/authSlice";

type SignupPageProps = {
  onSwitchToLogin: () => void;
};

const AuthBackground = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(3),
  background: "linear-gradient(135deg, #4b6cb7 0%, #182848 100%)",
}));

const AuthCard = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: 420,
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
}));

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
    <AuthBackground>
      <AuthCard elevation={8}>
        <Stack spacing={2.5}>
          <Typography variant="h5" align="center" fontWeight={700}>
            Create Account
          </Typography>

          {displayError && <Alert severity="error">{displayError}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                fullWidth
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </Stack>
          </Box>

          <Typography variant="body2" align="center">
            Already have an account?{" "}
            <Button variant="text" onClick={onSwitchToLogin}>
              Login
            </Button>
          </Typography>
        </Stack>
      </AuthCard>
    </AuthBackground>
  );
}
