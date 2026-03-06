import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type ShopGoldGroupProps = {
  gold: number;
  suppliesCostInGold: number;
  isSuppliesButtonDisabled: boolean;
  creditGenerationCost: number;
  canAffordCreditGeneration: boolean;
  onBuySupplies: () => void;
  onIncreaseCreditGeneration: () => void;
};

function ShopGoldGroup({
  gold,
  suppliesCostInGold,
  isSuppliesButtonDisabled,
  creditGenerationCost,
  canAffordCreditGeneration,
  onBuySupplies,
  onIncreaseCreditGeneration,
}: ShopGoldGroupProps): JSX.Element {
  return (
    <ShopGroup>
      <Typography variant="body2" color="text.secondary">
        Gold Available: <strong>{gold}g</strong>
      </Typography>

      <ShopRow>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            200 Supplies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: {suppliesCostInGold}g
          </Typography>
        </Box>
        <Button
          onClick={onBuySupplies}
          variant="contained"
          disabled={isSuppliesButtonDisabled}
        >
          Buy
        </Button>
      </ShopRow>

      <ShopRow>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Increase Credit Generation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: {creditGenerationCost}g
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Permanently increase credit generation by 0.1 per second
          </Typography>
        </Box>
        <Button
          onClick={onIncreaseCreditGeneration}
          variant="contained"
          disabled={!canAffordCreditGeneration}
        >
          Buy
        </Button>
      </ShopRow>
    </ShopGroup>
  );
}

export default ShopGoldGroup;
