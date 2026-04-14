import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { useRealtime } from "../../hooks/useRealtime";
import { useAppSelector } from "../../store/hooks";

const LATE_UPDATE_MS = 7000;

type SignalState = "healthy" | "late" | "disconnected";

const StatusRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(1, 1.25),
  borderRadius: 14,
  border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
  backgroundColor: alpha(theme.palette.common.white, 0.03),
}));

function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) {
    return "No update received yet";
  }
  return new Date(timestamp).toLocaleTimeString();
}

export default function RealtimeStatusPanel() {
  const [showDetails, setShowDetails] = useState(false);
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
      ? "success"
      : signalState === "late"
        ? "warning"
        : "error";

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
    <Stack spacing={1} sx={{ minWidth: 0 }}>
      <Box>
        <Chip
          clickable
          icon={<SignalCellularAltIcon color={signalColor} />}
          label={`System status: ${
            signalState === "healthy"
              ? "Healthy"
              : signalState === "late"
                ? "Delayed"
                : "Disconnected"
          }`}
          color={signalColor}
          onClick={() => setShowDetails((currentValue) => !currentValue)}
          variant="outlined"
        />
      </Box>

      <Collapse in={showDetails}>
        <Stack spacing={1} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {statusText}
          </Typography>

          <StatusRow>
            <Typography variant="body2">Last update</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatTimestamp(lastUpdateAt)}
            </Typography>
          </StatusRow>

          <StatusRow>
            <Typography variant="body2">Active issues</Typography>
            <Typography variant="body2" color="text.secondary">
              {errorMessages.length}
            </Typography>
          </StatusRow>

          {errorMessages.length > 0 && (
            <Stack spacing={1}>
              {errorMessages.map((message, idx) => (
                <Alert key={`${message}-${idx}`} severity="error">
                  {message}
                </Alert>
              ))}
            </Stack>
          )}
        </Stack>
      </Collapse>
    </Stack>
  );
}
