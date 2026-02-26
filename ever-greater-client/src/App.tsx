import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import { styled } from "@mui/material/styles";
import { useEffect, useState } from "react";
import LoginPage from "./components/LoginPage";
import ScalingNumberDemo from "./components/ScalingNumberDemo";
import SignupPage from "./components/SignupPage";
import cLogo from "./images/cLogo.png";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { checkAuthThunk, logoutThunk } from "./store/slices/authSlice";
import { fetchCountThunk } from "./store/slices/ticketSlice";

type AuthPage = "login" | "signup";

const AppRoot = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.background.default,
}));

const AppFooter = styled(Box, {
  shouldForwardProp: (prop) => prop !== "component",
})(({ theme }) => ({
  width: "100%",
  height: 56,
  backgroundColor: theme.palette.primary.main,
  display: "flex",
  alignItems: "center",
  paddingLeft: theme.spacing(2),
}));

const FooterLogo = styled("img")({
  height: 40,
  width: 40,
});

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
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <AppRoot>
        {authPage === "login" ? (
          <LoginPage onSwitchToSignup={() => setAuthPage("signup")} />
        ) : (
          <SignupPage onSwitchToLogin={() => setAuthPage("login")} />
        )}
      </AppRoot>
    );
  }

  return (
    <AppRoot>
      <Container maxWidth="md" sx={{ flex: 1, py: 4 }}>
        <ScalingNumberDemo onLogout={handleLogout} />
      </Container>

      <AppFooter as="footer">
        <FooterLogo src={cLogo} alt="site by C" />
      </AppFooter>
    </AppRoot>
  );
}

export default App;
