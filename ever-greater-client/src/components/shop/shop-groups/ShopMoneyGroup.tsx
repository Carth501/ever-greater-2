import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { JSX, useState, type WheelEvent } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type ShopMoneyGroupProps = {
  money: number;
  goldCostPerUnit: number;
  onBuyGold: (quantity: number) => void;
};

function parseGoldQuantity(value: string): number | null {
  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
    return null;
  }

  return parsedValue;
}

function getScrolledGoldQuantity(value: string, deltaY: number): string {
  const currentQuantity = parseGoldQuantity(value);

  if (deltaY === 0) {
    return value;
  }

  if (currentQuantity === null) {
    return "1";
  }

  const nextQuantity =
    deltaY < 0 ? currentQuantity + 1 : Math.max(1, currentQuantity - 1);

  return String(nextQuantity);
}

function ShopMoneyGroup({
  money,
  goldCostPerUnit,
  onBuyGold,
}: ShopMoneyGroupProps): JSX.Element {
  const [goldQuantityInput, setGoldQuantityInput] = useState("1");
  const goldQuantity = parseGoldQuantity(goldQuantityInput);
  const maxAffordableGoldQuantity =
    goldCostPerUnit > 0
      ? Math.floor(money / goldCostPerUnit)
      : Number.MAX_SAFE_INTEGER;
  const canBuyGold =
    goldQuantity !== null && goldQuantity <= maxAffordableGoldQuantity;

  const handleGoldQuantityWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    event.preventDefault();
    setGoldQuantityInput((currentValue) =>
      getScrolledGoldQuantity(currentValue, event.deltaY),
    );
  };

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
          <TextField
            label="Gold quantity"
            type="number"
            value={goldQuantityInput}
            onChange={(event) => setGoldQuantityInput(event.target.value)}
            onWheelCapture={handleGoldQuantityWheel}
            inputProps={{ min: 1, step: 1 }}
            size="small"
            sx={{ width: 144 }}
          />
          <Button
            onClick={() => {
              if (goldQuantity === null || !canBuyGold) {
                return;
              }

              onBuyGold(goldQuantity);
            }}
            variant="contained"
            disabled={!canBuyGold}
            size="small"
          >
            Buy Gold
          </Button>
        </Box>
      </ShopRow>
    </ShopGroup>
  );
}

export default ShopMoneyGroup;
