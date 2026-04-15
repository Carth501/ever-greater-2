import LayersIcon from "@mui/icons-material/Layers";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";
import { ShopGroup, ShopRow } from "../../shop/shop-groups/ShopGroupLayout";
import { formatNumber } from "./helpers";
import { PanelCard } from "./styles";

type DashboardShopPanelProps = {
  autoBuyCost: number;
  autoprinters: number;
  autoBuySuppliesPurchased: boolean;
  canAffordAutoprinter: boolean;
  creditCapacityCost: number;
  creditGenerationCost: number;
  creditGenerationLevel: number;
  goldUnitCost: number;
  hasLiveUser: boolean;
  suggestedFocus: string;
  suppliesCost: number;
};

export function DashboardShopPanel({
  autoBuyCost,
  autoprinters,
  autoBuySuppliesPurchased,
  canAffordAutoprinter,
  creditCapacityCost,
  creditGenerationCost,
  creditGenerationLevel,
  goldUnitCost,
  hasLiveUser,
  suggestedFocus,
  suppliesCost,
}: DashboardShopPanelProps) {
  const headingId = useId();
  const descriptionId = useId();

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <PanelCard elevation={0}>
        <Stack spacing={2.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Box>
              <Typography id={headingId} variant="h5" fontWeight={700}>
                Modular shop surfaces
              </Typography>
              <Typography
                id={descriptionId}
                variant="body2"
                color="text.secondary"
              >
                Shop groups become independent cards that can be docked together
                or hidden when the user wants a cleaner print-focused layout.
              </Typography>
            </Box>
            <Chip
              icon={<LayersIcon />}
              label="Dockable groups"
              variant="outlined"
              color="primary"
            />
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 2,
            }}
          >
            <ShopGroup elevation={0}>
              <Typography variant="subtitle1" fontWeight={700}>
                Gold & Supplies
              </Typography>
              <ShopRow>
                <Typography variant="body2">Supply refill</Typography>
                <Chip
                  label={`${formatNumber(suppliesCost)} gold`}
                  color="primary"
                  size="small"
                />
              </ShopRow>
              <ShopRow>
                <Typography variant="body2">Auto-buy unlock</Typography>
                <Chip
                  label={
                    autoBuySuppliesPurchased
                      ? "Unlocked"
                      : `${formatNumber(autoBuyCost)} gold`
                  }
                  color={autoBuySuppliesPurchased ? "success" : "default"}
                  size="small"
                />
              </ShopRow>
              <ShopRow>
                <Typography variant="body2">Credit generation</Typography>
                <Chip
                  label={`Lvl ${creditGenerationLevel} · ${formatNumber(creditGenerationCost)} gold`}
                  color="info"
                  size="small"
                />
              </ShopRow>
            </ShopGroup>

            <ShopGroup elevation={0}>
              <Typography variant="subtitle1" fontWeight={700}>
                Credit Systems
              </Typography>
              <ShopRow>
                <Typography variant="body2">Autoprinters</Typography>
                <Chip
                  label={`${formatNumber(autoprinters)} active`}
                  color="primary"
                  size="small"
                />
              </ShopRow>
              <ShopRow>
                <Typography variant="body2">Capacity upgrade</Typography>
                <Chip
                  label={`${formatNumber(creditCapacityCost)} tickets`}
                  color="default"
                  size="small"
                />
              </ShopRow>
              <ShopRow>
                <Typography variant="body2">Spend confidence</Typography>
                <Chip
                  label={canAffordAutoprinter ? "High" : "Hold"}
                  color={canAffordAutoprinter ? "success" : "warning"}
                  size="small"
                />
              </ShopRow>
            </ShopGroup>

            <ShopGroup elevation={0}>
              <Typography variant="subtitle1" fontWeight={700}>
                Market View
              </Typography>
              <ShopRow>
                <Typography variant="body2">Money to gold</Typography>
                <Chip
                  label={`${formatNumber(goldUnitCost)} money / gold`}
                  color="default"
                  size="small"
                />
              </ShopRow>
              <ShopRow>
                <Typography variant="body2">Recommended next buy</Typography>
                <Chip label={suggestedFocus} color="warning" size="small" />
              </ShopRow>
              <ShopRow>
                <Typography variant="body2">Panel mode</Typography>
                <Chip
                  label={hasLiveUser ? "Live-bound" : "Compact"}
                  color="primary"
                  size="small"
                />
              </ShopRow>
            </ShopGroup>
          </Box>
        </Stack>
      </PanelCard>
    </Box>
  );
}
