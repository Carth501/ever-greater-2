import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type UpgradeGemGroupProps = {
  gems: number;
  currentMoneyPerTicket: number;
  nextMoneyPerTicket: number;
  cost: number;
  level: number;
  canAfford: boolean;
  onIncreaseMoneyPerTicket: () => void;
};

function UpgradeGemGroup({
  gems,
  currentMoneyPerTicket,
  nextMoneyPerTicket,
  cost,
  level,
  canAfford,
  onIncreaseMoneyPerTicket,
}: UpgradeGemGroupProps): JSX.Element {
  return (
    <ShopGroup>
      <Typography variant="body2" color="text.secondary">
        Gems Available: <strong>{gems}</strong>
      </Typography>

      <ShopRow>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Increase Money Per Ticket
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: {cost} gem{cost === 1 ? "" : "s"} · Lvl {level}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Raises each printed ticket from {currentMoneyPerTicket} money to{" "}
            {nextMoneyPerTicket} money.
          </Typography>
        </Box>
        <Button
          onClick={onIncreaseMoneyPerTicket}
          variant="contained"
          disabled={!canAfford}
        >
          Buy
        </Button>
      </ShopRow>
    </ShopGroup>
  );
}

export default UpgradeGemGroup;
