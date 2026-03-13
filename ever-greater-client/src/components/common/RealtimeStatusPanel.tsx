import CloseIcon from "@mui/icons-material/Close";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useRealtime } from "../../hooks/useRealtime";
import { useAppSelector } from "../../store/hooks";

const LATE_UPDATE_MS = 7000;

type SignalState = "healthy" | "late" | "disconnected";

function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) {
    return "No update received yet";
  }
  return new Date(timestamp).toLocaleTimeString();
}

export default function RealtimeStatusPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [clock, setClock] = useState(Date.now());

  const { isConnected, isReconnecting, lastUpdateAt } = useRealtime();
  const authError = useAppSelector((state) => state.auth.error);
  const ticketError = useAppSelector((state) => state.ticket.error);
  const systemError = useAppSelector((state) => state.error.message);

  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const signalState: SignalState = useMemo(() => {
    if (!isConnected) {
      return "disconnected";
    }

    if (
      isReconnecting ||
      !lastUpdateAt ||
      clock - lastUpdateAt > LATE_UPDATE_MS
    ) {
      return "late";
    }

    return "healthy";
  }, [clock, isConnected, isReconnecting, lastUpdateAt]);

  const signalColor =
    signalState === "healthy"
      ? "success.main"
      : signalState === "late"
        ? "warning.main"
        : "error.main";

  const statusText =
    signalState === "healthy"
      ? "Realtime updates are healthy"
      : signalState === "late"
        ? "Realtime updates appear delayed"
        : "Realtime connection is disconnected";

  const errorMessages = [systemError, ticketError, authError].filter(
    (msg): msg is string => Boolean(msg),
  );

  return (
    <>
      <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 1400 }}>
        <Tooltip title={statusText}>
          <IconButton
            aria-label="Open realtime status panel"
            onClick={() => setIsOpen(true)}
            sx={{ bgcolor: "background.paper", boxShadow: 3 }}
          >
            <SignalCellularAltIcon sx={{ color: signalColor }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Drawer anchor="right" open={isOpen} onClose={() => setIsOpen(false)}>
        <Box sx={{ width: 340, p: 2 }} role="presentation">
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">Connection Status</Typography>
              <IconButton
                aria-label="Close realtime status panel"
                onClick={() => setIsOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </Stack>

            <Alert
              severity={
                signalState === "healthy"
                  ? "success"
                  : signalState === "late"
                    ? "warning"
                    : "error"
              }
            >
              {statusText}
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Last update: {formatTimestamp(lastUpdateAt)}
            </Typography>

            {errorMessages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No active errors.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {errorMessages.map((message, idx) => (
                  <Alert key={`${message}-${idx}`} severity="error">
                    {message}
                  </Alert>
                ))}
              </Stack>
            )}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
