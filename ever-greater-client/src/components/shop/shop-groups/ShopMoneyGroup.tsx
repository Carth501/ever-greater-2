import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type ShopMoneyGroupProps = {
  money: number;
  goldCostPerUnit: number;
  canAffordGold1: boolean;
  canAffordGold10: boolean;
  canAffordGold100: boolean;
  onBuyGold: (quantity: number) => void;
};

function ShopMoneyGroup({
  money,
  goldCostPerUnit,
  canAffordGold1,
  canAffordGold10,
  canAffordGold100,
  onBuyGold,
}: ShopMoneyGroupProps): JSX.Element {
  return (
    <ShopGroup>
      <Typography variant="body2" color="text.secondary">
        Money Available: <strong>${money}</strong>
      </Typography>

      <ShopRow>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Gold
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: ${goldCostPerUnit} each
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={() => onBuyGold(1)}
            variant="contained"
            disabled={!canAffordGold1}
            size="small"
          >
            Buy 1
          </Button>
          <Button
            onClick={() => onBuyGold(10)}
            variant="contained"
            disabled={!canAffordGold10}
            size="small"
          >
            Buy 10
          </Button>
          <Button
            onClick={() => onBuyGold(100)}
            variant="contained"
            disabled={!canAffordGold100}
            size="small"
          >
            Buy 100
          </Button>
        </Box>
      </ShopRow>
    </ShopGroup>
  );
}

export default ShopMoneyGroup;
