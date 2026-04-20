import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  AutoBuyResourceKey,
  AutoBuyScaleMode,
  getAutoBuyRule,
  getBuySuppliesGainForGold,
  getMaxSuppliesPurchaseGold,
  resolveAutoBuySpendAmount,
  type User,
} from "ever-greater-shared";
import { useEffect, useId, useState } from "react";
import { useOperations } from "../../../hooks/useOperations";
import { dashboardContent } from "./content";
import { formatNumber } from "./helpers";
import { MetricCard, MetricsRow, PanelCard } from "./styles";

type DashboardAutoBuyManagementPanelProps = {
  hasLiveUser: boolean;
  manualPrintQuantity: number;
  user: User;
};

const scaleOptions = [
  { value: AutoBuyScaleMode.MIN, label: "Min" },
  { value: AutoBuyScaleMode.CUSTOM_VALUE, label: "Custom Value" },
  { value: AutoBuyScaleMode.CUSTOM_PERCENT, label: "Custom Percent" },
  { value: AutoBuyScaleMode.MAX, label: "Max" },
];

function clampThresholdInput(value: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.round(parsed));
}

function clampScaleValueInput(
  value: string,
  scaleMode: AutoBuyScaleMode,
): number {
  const parsed = Number(value);

  if (scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT) {
    if (!Number.isFinite(parsed)) {
      return 1;
    }

    return Math.min(100, Math.max(1, Math.round(parsed)));
  }

  if (scaleMode === AutoBuyScaleMode.CUSTOM_VALUE) {
    if (!Number.isFinite(parsed)) {
      return 1;
    }

    return Math.max(1, Math.round(parsed));
  }

  return 0;
}

function getScaleValueInputValue(
  scaleMode: AutoBuyScaleMode,
  scaleValue: number,
): string {
  return scaleMode === AutoBuyScaleMode.CUSTOM_VALUE ||
    scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT
    ? String(scaleValue)
    : "";
}

export function DashboardAutoBuyManagementPanel({
  hasLiveUser,
  manualPrintQuantity,
  user,
}: DashboardAutoBuyManagementPanelProps) {
  const headingId = useId();
  const descriptionId = useId();
  const currentRule = getAutoBuyRule(
    user.auto_buy_settings,
    AutoBuyResourceKey.PRINTER_SUPPLIES,
  );
  const [thresholdInput, setThresholdInput] = useState(
    String(currentRule.threshold),
  );
  const [scaleMode, setScaleMode] = useState<AutoBuyScaleMode>(
    currentRule.scaleMode,
  );
  const [scaleValueInput, setScaleValueInput] = useState(
    getScaleValueInputValue(currentRule.scaleMode, currentRule.scaleValue),
  );
  const { configureAutoBuy, isLoading, toggleAutoBuySupplies } =
    useOperations();

  useEffect(() => {
    setThresholdInput(String(currentRule.threshold));
    setScaleMode(currentRule.scaleMode);
    setScaleValueInput(
      getScaleValueInputValue(currentRule.scaleMode, currentRule.scaleValue),
    );
  }, [currentRule.scaleMode, currentRule.scaleValue, currentRule.threshold]);

  const usesCustomScaleValue =
    scaleMode === AutoBuyScaleMode.CUSTOM_VALUE ||
    scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT;
  const normalizedThreshold = clampThresholdInput(thresholdInput);
  const normalizedScaleValue = clampScaleValueInput(scaleValueInput, scaleMode);
  const maxSpendGold = Math.min(
    user.gold ?? 0,
    getMaxSuppliesPurchaseGold(user),
  );
  const previewSpendGold = resolveAutoBuySpendAmount(
    {
      threshold: normalizedThreshold,
      scaleMode,
      scaleValue: normalizedScaleValue,
    },
    user.gold ?? 0,
    maxSpendGold,
  );
  const previewSupplies = getBuySuppliesGainForGold(previewSpendGold);
  const effectiveTriggerFloor = Math.max(
    normalizedThreshold,
    manualPrintQuantity,
  );
  const hasDraftChanges =
    normalizedThreshold !== currentRule.threshold ||
    scaleMode !== currentRule.scaleMode ||
    normalizedScaleValue !== currentRule.scaleValue;
  const canManage = hasLiveUser && user.auto_buy_supplies_purchased;
  const statusLabel = !user.auto_buy_supplies_purchased
    ? "Unlock required"
    : user.auto_buy_supplies_active
      ? "Active"
      : "Paused";
  const statusColor = !user.auto_buy_supplies_purchased
    ? "warning"
    : user.auto_buy_supplies_active
      ? "success"
      : "default";

  const saveRule = () => {
    configureAutoBuy({
      resourceKey: AutoBuyResourceKey.PRINTER_SUPPLIES,
      threshold: normalizedThreshold,
      scaleMode,
      scaleValue: normalizedScaleValue,
    });
  };

  return (
    <Box
      component="section"
      aria-label={dashboardContent.autoBuy.regionLabel}
      aria-describedby={descriptionId}
    >
      <PanelCard elevation={0}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Typography id={headingId} variant="h5" fontWeight={700}>
                {dashboardContent.autoBuy.heading}
              </Typography>
              <Typography
                id={descriptionId}
                variant="body2"
                color="text.secondary"
              >
                {dashboardContent.autoBuy.description}
              </Typography>
            </Box>
            <Chip label={statusLabel} color={statusColor} variant="outlined" />
          </Stack>

          <MetricsRow>
            <MetricCard>
              <Typography variant="subtitle2" color="text.secondary">
                Resource
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                Printer supplies
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current stock {formatNumber(user.printer_supplies)}
              </Typography>
            </MetricCard>

            <MetricCard>
              <Typography variant="subtitle2" color="text.secondary">
                Trigger floor
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(effectiveTriggerFloor)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Threshold or print batch, whichever is higher
              </Typography>
            </MetricCard>

            <MetricCard>
              <Typography variant="subtitle2" color="text.secondary">
                Preview spend
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(previewSpendGold)} gold
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatNumber(previewSupplies)} supplies at the current batch
                cap
              </Typography>
            </MetricCard>
          </MetricsRow>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <TextField
              label="Threshold"
              type="number"
              value={thresholdInput}
              onChange={(event) => setThresholdInput(event.target.value)}
              inputProps={{ min: 0, step: 1 }}
              disabled={!canManage || isLoading}
              helperText="Attempt a refill once supplies dip below this floor."
            />

            <TextField
              select
              label="Scale"
              value={scaleMode}
              onChange={(event) => {
                const nextScaleMode = event.target.value as AutoBuyScaleMode;
                setScaleMode(nextScaleMode);
                if (
                  nextScaleMode !== AutoBuyScaleMode.CUSTOM_PERCENT &&
                  nextScaleMode !== AutoBuyScaleMode.CUSTOM_VALUE
                ) {
                  setScaleValueInput("");
                } else if (scaleValueInput.trim() === "") {
                  setScaleValueInput("1");
                }
              }}
              disabled={!canManage || isLoading}
              helperText="Choose how aggressively auto-buy spends gold."
            >
              {scaleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label={
                scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT
                  ? "Custom percent"
                  : "Custom value"
              }
              type="number"
              value={scaleValueInput}
              onChange={(event) => setScaleValueInput(event.target.value)}
              inputProps={{
                min: 1,
                max:
                  scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT
                    ? 100
                    : undefined,
                step: 1,
              }}
              disabled={!canManage || isLoading || !usesCustomScaleValue}
              helperText={
                scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT
                  ? "Rounded and clamped to 1-100% of current gold."
                  : "Spend a fixed amount of gold when the rule triggers."
              }
            />
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                {canManage
                  ? `The current rule will try to spend ${formatNumber(previewSpendGold)} gold for ${formatNumber(previewSupplies)} supplies whenever stock falls short.`
                  : hasLiveUser
                    ? "Unlock auto-buy supplies in the shop before adjusting the refill policy."
                    : "Preview mode shows the policy shape, but live changes are disabled until an account is connected."}
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="outlined"
                onClick={() =>
                  toggleAutoBuySupplies(!user.auto_buy_supplies_active)
                }
                disabled={!canManage || isLoading}
              >
                {user.auto_buy_supplies_active
                  ? "Pause auto-buy"
                  : "Resume auto-buy"}
              </Button>
              <Button
                variant="contained"
                onClick={saveRule}
                disabled={!canManage || isLoading || !hasDraftChanges}
              >
                Save settings
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </PanelCard>
    </Box>
  );
}
