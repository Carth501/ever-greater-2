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
import { loginThunk } from "../store/slices/authSlice";

type LoginPageProps = {
  onSwitchToSignup: () => void;
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
    <AuthBackground>
      <AuthCard elevation={8}>
        <Stack spacing={2.5}>
          <Typography variant="h5" align="center" fontWeight={700}>
            Login
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

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </Stack>
          </Box>

          <Typography variant="body2" align="center">
            Don't have an account?{" "}
            <Button variant="text" onClick={onSwitchToSignup}>
              Create one
            </Button>
          </Typography>
        </Stack>
      </AuthCard>
    </AuthBackground>
  );
}
