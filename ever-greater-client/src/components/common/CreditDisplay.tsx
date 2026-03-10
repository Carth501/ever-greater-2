import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import type { User } from "../../api/auth";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

type CreditDisplayProps = {
  user: User;
};

/**
 * Displays the player's credit resources.
 * - credit_value: Current balance
 * - credit_capacity_level: Max capacity (capacity_level × 1)
 * - credit_generation_level: Generation rate per second (generation_level × 0.1)
 */
function CreditDisplay({ user }: CreditDisplayProps): JSX.Element {
  const creditValue = Number(user.credit_value ?? 0);
  const creditCapacity = Number(user.credit_capacity_level ?? 0);
  const creditRate = Number(user.credit_generation_level ?? 0) * 0.1;

  // Ensure we don't divide by zero
  const progressValue =
    creditCapacity > 0 ? (creditValue / creditCapacity) * 100 : 0;

  const creditValueDisplay = useAnimatedNumber(creditValue, 1);
  return (
    <Stack spacing={1}>
      <Box>
        <Typography variant="body1" color="text.secondary">
          Credit: <strong>{creditValueDisplay.toFixed(1)}</strong> /{" "}
          {creditCapacity}
        </Typography>
        {creditCapacity > 0 && (
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{ mt: 0.5 }}
          />
        )}
      </Box>
      <Typography variant="body2" color="text.secondary">
        Generation: <strong>{creditRate.toFixed(1)}</strong> per second
      </Typography>
    </Stack>
  );
}

export default CreditDisplay;
