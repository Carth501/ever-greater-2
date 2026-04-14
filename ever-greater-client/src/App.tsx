import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import { styled } from "@mui/material/styles";
import { useEffect, useState } from "react";
import RealtimeStatusPanel from "./components/common/RealtimeStatusPanel";
import DashboardConceptPage from "./components/pages/DashboardConceptPage";
import EverGreaterMainPage from "./components/pages/EverGreaterMainPage";
import LoginPage from "./components/pages/LoginPage";
import PreviewIndexPage from "./components/pages/PreviewIndexPage";
import SignupPage from "./components/pages/SignupPage";
import cLogo from "./images/cLogo.png";
import { getPreviewMode } from "./lib/previewMode";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { checkAuthThunk, logoutThunk } from "./store/slices/authSlice";
import { fetchCountThunk } from "./store/slices/ticketSlice";

type AuthPage = "login" | "signup";

const AppRoot = styled(Box)(({ theme }) => ({
  height: "100vh",
  backgroundColor: theme.palette.background.default,
}));

const AppFooter = styled(Box, {
  shouldForwardProp: (prop) => prop !== "component",
})(({ theme }) => ({
  position: "fixed",
  bottom: 0,
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
  const [previewMode, setPreviewMode] = useState(() =>
    getPreviewMode(window.location),
  );

  const isPreviewMode = previewMode !== null;
  const showConceptControls =
    previewMode?.kind === "dashboard" ? previewMode.showControls : true;

  // Check if user is already logged in on mount
  useEffect(() => {
    dispatch(checkAuthThunk());
  }, [dispatch]);

  useEffect(() => {
    const handleLocationChange = () => {
      setPreviewMode(getPreviewMode(window.location));
    };

    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

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

  if (!isPreviewMode && isCheckingAuth) {
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

  if (isPreviewMode) {
    const contentHeight = `calc(100vh - 56px)`;

    return (
      <AppRoot>
        <Container
          maxWidth={false}
          disableGutters
          sx={{ flex: 1, overflowY: "scroll", maxHeight: contentHeight }}
        >
          {previewMode?.kind === "dashboard" ? (
            <DashboardConceptPage showControls={showConceptControls} />
          ) : (
            <PreviewIndexPage />
          )}
        </Container>

        <AppFooter as="footer">
          <FooterLogo src={cLogo} alt="site by C" />
        </AppFooter>
      </AppRoot>
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

  const contentHeight = `calc(100vh - 56px)`;

  return (
    <AppRoot>
      <RealtimeStatusPanel />

      <Container
        maxWidth="xl"
        sx={{ flex: 1, py: 4, overflowY: "scroll", maxHeight: contentHeight }}
      >
        <EverGreaterMainPage onLogout={handleLogout} />
      </Container>

      <AppFooter as="footer">
        <FooterLogo src={cLogo} alt="site by C" />
      </AppFooter>
    </AppRoot>
  );
}

export default App;
