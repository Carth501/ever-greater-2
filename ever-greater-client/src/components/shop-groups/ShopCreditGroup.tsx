import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { User } from "ever-greater-shared";
import { JSX } from "react";
import CreditDisplay from "../CreditDisplay";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type ShopCreditGroupProps = {
  user: User;
  autoprinters: number;
  autoprinterCost: number;
  canAffordAutoprinter: boolean;
  onBuyAutoprinter: () => void;
};

function ShopCreditGroup({
  user,
  autoprinters,
  autoprinterCost,
  canAffordAutoprinter,
  onBuyAutoprinter,
}: ShopCreditGroupProps): JSX.Element {
  return (
    <ShopGroup>
      <CreditDisplay user={user} />
      <Typography variant="body2" color="text.secondary">
        Autoprinters: <strong>{autoprinters}</strong>
      </Typography>

      <ShopRow>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Autoprinter
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: {autoprinterCost} credit
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Prints 1 ticket every 4 seconds (uses supplies)
          </Typography>
        </Box>
        <Button
          onClick={onBuyAutoprinter}
          variant="contained"
          disabled={!canAffordAutoprinter}
        >
          Buy
        </Button>
      </ShopRow>
    </ShopGroup>
  );
}

export default ShopCreditGroup;
