import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type UpgradeGoldGroupProps = {
  gold: number;
  autoBuyCost: number;
  autoBuyPurchased: boolean;
  autoBuyActive: boolean;
  canAffordAutoBuyUnlock: boolean;
  creditGenerationCost: number;
  canAffordCreditGeneration: boolean;
  manualPrintBatchCost: number;
  manualPrintBatchLevel: number;
  currentManualPrintQuantity: number;
  nextManualPrintQuantity: number;
  canAffordManualPrintBatch: boolean;
  suppliesBatchCost: number;
  suppliesBatchLevel: number;
  currentSuppliesBatchAmount: number;
  currentSuppliesBatchGold: number;
  nextSuppliesBatchAmount: number;
  nextSuppliesBatchGold: number;
  canAffordSuppliesBatch: boolean;
  onBuyAutoBuySupplies: () => void;
  onToggleAutoBuySupplies: (active: boolean) => void;
  onIncreaseCreditGeneration: () => void;
  onIncreaseManualPrintBatch: () => void;
  onIncreaseSuppliesBatch: () => void;
};

function UpgradeGoldGroup({
  gold,
  autoBuyCost,
  autoBuyPurchased,
  autoBuyActive,
  canAffordAutoBuyUnlock,
  creditGenerationCost,
  canAffordCreditGeneration,
  manualPrintBatchCost,
  manualPrintBatchLevel,
  currentManualPrintQuantity,
  nextManualPrintQuantity,
  canAffordManualPrintBatch,
  suppliesBatchCost,
  suppliesBatchLevel,
  currentSuppliesBatchAmount,
  currentSuppliesBatchGold,
  nextSuppliesBatchAmount,
  nextSuppliesBatchGold,
  canAffordSuppliesBatch,
  onBuyAutoBuySupplies,
  onToggleAutoBuySupplies,
  onIncreaseCreditGeneration,
  onIncreaseManualPrintBatch,
  onIncreaseSuppliesBatch,
}: UpgradeGoldGroupProps): JSX.Element {
  return (
    <ShopGroup>
      <Typography variant="body2" color="text.secondary">
        Gold Available: <strong>{gold}g</strong>
      </Typography>

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
            Increase Manual Print Batch
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: {manualPrintBatchCost}g · Lvl {manualPrintBatchLevel}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Doubles each manual print from {currentManualPrintQuantity} ticket
            {currentManualPrintQuantity === 1 ? "" : "s"} to{" "}
            {nextManualPrintQuantity} ticket
            {nextManualPrintQuantity === 1 ? "" : "s"} per press.
          </Typography>
        </Box>
        <Button
          onClick={onIncreaseManualPrintBatch}
          variant="contained"
          disabled={!canAffordManualPrintBatch}
        >
          Buy
        </Button>
      </ShopRow>

      <ShopRow>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Increase Supplies Batch
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: {suppliesBatchCost}g · Lvl {suppliesBatchLevel}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Doubles your max refill from {currentSuppliesBatchAmount} supplies
            for {currentSuppliesBatchGold}g to {nextSuppliesBatchAmount}{" "}
            supplies for {nextSuppliesBatchGold}g.
          </Typography>
        </Box>
        <Button
          onClick={onIncreaseSuppliesBatch}
          variant="contained"
          disabled={!canAffordSuppliesBatch}
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

export default UpgradeGoldGroup;
