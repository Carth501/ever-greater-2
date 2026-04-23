import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type UpgradeGoldGemGroupProps = {
  gold: number;
  gems: number;
  level: number;
  currentCreditCapacityAmount: number;
  nextCreditCapacityAmount: number;
  goldCost: number;
  gemCost: number;
  canAfford: boolean;
  onIncreaseCreditCapacityAmount: () => void;
};

function UpgradeGoldGemGroup({
  gold,
  gems,
  level,
  currentCreditCapacityAmount,
  nextCreditCapacityAmount,
  goldCost,
  gemCost,
  canAfford,
  onIncreaseCreditCapacityAmount,
}: UpgradeGoldGemGroupProps): JSX.Element {
  return (
    <ShopGroup>
      <Typography variant="body2" color="text.secondary">
        Gold Available: <strong>{gold}g</strong> | Gems Available:{" "}
        <strong>{gems}</strong>
      </Typography>

      <ShopRow>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Increase Credit Capacity Amount
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: {goldCost}g + {gemCost} gem{gemCost === 1 ? "" : "s"} · Lvl{" "}
            {level}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Raises each credit capacity level from +
            {currentCreditCapacityAmount} max credit to +
            {nextCreditCapacityAmount} max credit.
          </Typography>
        </Box>
        <Button
          onClick={onIncreaseCreditCapacityAmount}
          variant="contained"
          disabled={!canAfford}
        >
          Buy
        </Button>
      </ShopRow>
    </ShopGroup>
  );
}

export default UpgradeGoldGemGroup;
