import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type ShopGlobalTicketsGroupProps = {
  globalTicketCount: number;
  remainingCapacity: number;
  creditCapacityCost: number;
  creditCapacityGain: number;
  canAffordCreditCapacity: boolean;
  onIncreaseCreditCapacity: () => void;
};

function ShopGlobalTicketsGroup({
  globalTicketCount,
  remainingCapacity,
  creditCapacityCost,
  creditCapacityGain,
  canAffordCreditCapacity,
  onIncreaseCreditCapacity,
}: ShopGlobalTicketsGroupProps): JSX.Element {
  return (
    <ShopGroup>
      <Typography variant="body2" color="text.secondary">
        Global Tickets Available: <strong>{globalTicketCount}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Remaining Draw Capacity: <strong>{remainingCapacity}</strong>
      </Typography>

      <ShopRow>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Increase Credit Capacity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: {creditCapacityCost} tickets
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Increase capacity level by 1 and max credit by {creditCapacityGain}
          </Typography>
        </Box>
        <Button
          onClick={onIncreaseCreditCapacity}
          variant="contained"
          disabled={!canAffordCreditCapacity}
        >
          Buy
        </Button>
      </ShopRow>
    </ShopGroup>
  );
}

export default ShopGlobalTicketsGroup;
