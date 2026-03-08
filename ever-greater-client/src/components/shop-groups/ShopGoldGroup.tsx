import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type ShopGoldGroupProps = {
  gold: number;
  suppliesCostInGold: number;
  isSuppliesButtonDisabled: boolean;
  autoBuyCost: number;
  autoBuyPurchased: boolean;
  autoBuyActive: boolean;
  canAffordAutoBuyUnlock: boolean;
  creditGenerationCost: number;
  canAffordCreditGeneration: boolean;
  onBuySupplies: () => void;
  onBuyAutoBuySupplies: () => void;
  onToggleAutoBuySupplies: (active: boolean) => void;
  onIncreaseCreditGeneration: () => void;
};

function ShopGoldGroup({
  gold,
  suppliesCostInGold,
  isSuppliesButtonDisabled,
  autoBuyCost,
  autoBuyPurchased,
  autoBuyActive,
  canAffordAutoBuyUnlock,
  creditGenerationCost,
  canAffordCreditGeneration,
  onBuySupplies,
  onBuyAutoBuySupplies,
  onToggleAutoBuySupplies,
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
            Auto-Buy Supplies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {autoBuyPurchased ? "Unlocked" : `Cost: ${autoBuyCost}g`}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {autoBuyPurchased
              ? "Toggle automatic supplies purchasing on and off"
              : "One-time unlock. You keep access permanently."}
          </Typography>
        </Box>
        {autoBuyPurchased ? (
          <FormControlLabel
            control={
              <Switch
                checked={autoBuyActive}
                onChange={(event) =>
                  onToggleAutoBuySupplies(event.target.checked)
                }
              />
            }
            label={autoBuyActive ? "Active" : "Inactive"}
          />
        ) : (
          <Button
            onClick={onBuyAutoBuySupplies}
            variant="contained"
            disabled={!canAffordAutoBuyUnlock}
          >
            Buy
          </Button>
        )}
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
