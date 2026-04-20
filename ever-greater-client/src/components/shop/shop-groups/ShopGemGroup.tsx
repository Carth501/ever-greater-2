import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type ShopGemGroupProps = {
  globalTicketCount: number;
  gemsOwned: number;
  remainingCapacity: number;
  gemCost: number;
  canAffordGem: boolean;
  onBuyGem: () => void;
};

function ShopGemGroup({
  globalTicketCount,
  gemsOwned,
  remainingCapacity,
  gemCost,
  canAffordGem,
  onBuyGem,
}: ShopGemGroupProps): JSX.Element {
  return (
    <ShopGroup>
      <Typography variant="body2" color="text.secondary">
        Global Tickets Available: <strong>{globalTicketCount}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Remaining Draw Capacity: <strong>{remainingCapacity}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Gems Owned: <strong>{gemsOwned}</strong>
      </Typography>

      <ShopRow>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Buy Gem
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: {gemCost} tickets
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Converts withdrawn ticket capacity into 1 permanent gem
          </Typography>
        </Box>
        <Button onClick={onBuyGem} variant="contained" disabled={!canAffordGem}>
          Buy
        </Button>
      </ShopRow>
    </ShopGroup>
  );
}

export default ShopGemGroup;
