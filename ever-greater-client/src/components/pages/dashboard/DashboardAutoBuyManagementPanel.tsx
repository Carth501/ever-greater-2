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
  getMaxAffordableGoldQuantity,
  getMaxSuppliesPurchaseGold,
  getOperationCost,
  getOperationGain,
  OperationId,
  operations,
  resolveAutoBuySpendAmount,
  ResourceType,
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

type AutoBuyRuleDraft = {
  thresholdInput: string;
  scaleMode: AutoBuyScaleMode;
  scaleValueInput: string;
};

type ManagedAutoBuyResource = {
  key: AutoBuyResourceKey;
  title: string;
  thresholdLabel: string;
  scaleLabel: string;
  customScaleLabel: string;
  thresholdHelperText: string;
  scaleHelperText: string;
  customHelperText: string;
  currentValue: number;
  currentValueSuffix: string;
  triggerFloor: number;
  triggerDescription: string;
  previewValue: string;
  previewDescription: string;
  summaryText: string;
  normalizedThreshold: number;
  normalizedScaleValue: number;
  hasDraftChanges: boolean;
  usesCustomScaleValue: boolean;
  saveButtonLabel: string;
};

const managedResourceKeys = [
  AutoBuyResourceKey.PRINTER_SUPPLIES,
  AutoBuyResourceKey.GOLD,
] as const;

const automatedOperationIds: Record<AutoBuyResourceKey, OperationId> = {
  [AutoBuyResourceKey.PRINTER_SUPPLIES]: OperationId.BUY_SUPPLIES,
  [AutoBuyResourceKey.GOLD]: OperationId.BUY_GOLD,
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

function isCustomScaleMode(scaleMode: AutoBuyScaleMode): boolean {
  return (
    scaleMode === AutoBuyScaleMode.CUSTOM_VALUE ||
    scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT
  );
}

function getPrimaryResourceType(
  amount: Partial<Record<ResourceType, number>>,
): ResourceType | null {
  const [resourceType] = Object.keys(amount) as ResourceType[];

  return resourceType ?? null;
}

function getResourceDisplayLabel(resourceType: ResourceType | null): string {
  switch (resourceType) {
    case ResourceType.PRINTER_SUPPLIES:
      return "Printer supplies";
    case ResourceType.MONEY:
      return "Money";
    case ResourceType.GOLD:
      return "Gold";
    case ResourceType.GEMS:
      return "Gems";
    case ResourceType.CREDIT:
      return "Credit";
    case ResourceType.GLOBAL_TICKETS:
      return "Tickets";
    case ResourceType.AUTOPRINTERS:
      return "Autoprinters";
    default:
      return "Resource";
  }
}

function getResourceDisplayNoun(resourceType: ResourceType | null): string {
  return getResourceDisplayLabel(resourceType).toLowerCase();
}

function getAutomatedOperationId(resourceKey: AutoBuyResourceKey): OperationId {
  return automatedOperationIds[resourceKey];
}

function getSpendResourceType(
  resourceKey: AutoBuyResourceKey,
  user: User,
): ResourceType | null {
  return getPrimaryResourceType(
    getOperationCost(operations[getAutomatedOperationId(resourceKey)], {
      user,
      params: { quantity: 1 },
    }),
  );
}

function getManagedResourceType(
  resourceKey: AutoBuyResourceKey,
  user: User,
): ResourceType | null {
  return getPrimaryResourceType(
    getOperationGain(operations[getAutomatedOperationId(resourceKey)], {
      user,
      params: { quantity: 1 },
    }),
  );
}

function getGoldUnitMoneyCost(user: User): number {
  return (
    getOperationCost(operations[OperationId.BUY_GOLD], {
      user,
      params: { quantity: 1 },
    })[ResourceType.MONEY] ?? 100
  );
}

function toDisplayedScaleValue(
  resourceKey: AutoBuyResourceKey,
  user: User,
  scaleMode: AutoBuyScaleMode,
  internalScaleValue: number,
): string {
  if (!isCustomScaleMode(scaleMode)) {
    return "";
  }

  if (
    resourceKey === AutoBuyResourceKey.GOLD &&
    scaleMode === AutoBuyScaleMode.CUSTOM_VALUE
  ) {
    return String(internalScaleValue * getGoldUnitMoneyCost(user));
  }

  return String(internalScaleValue);
}

function toInternalScaleValue(
  resourceKey: AutoBuyResourceKey,
  user: User,
  scaleMode: AutoBuyScaleMode,
  displayScaleValue: string,
): number {
  const normalizedDisplayValue = clampScaleValueInput(
    displayScaleValue,
    scaleMode,
  );

  if (
    resourceKey === AutoBuyResourceKey.GOLD &&
    scaleMode === AutoBuyScaleMode.CUSTOM_VALUE
  ) {
    return Math.max(
      1,
      Math.floor(normalizedDisplayValue / getGoldUnitMoneyCost(user)),
    );
  }

  return normalizedDisplayValue;
}

function getCustomValueMinimum(
  resourceKey: AutoBuyResourceKey,
  user: User,
  scaleMode: AutoBuyScaleMode,
): number {
  if (
    resourceKey === AutoBuyResourceKey.GOLD &&
    scaleMode === AutoBuyScaleMode.CUSTOM_VALUE
  ) {
    return getGoldUnitMoneyCost(user);
  }

  return 1;
}

function buildRuleDraft(
  resourceKey: AutoBuyResourceKey,
  user: User,
): AutoBuyRuleDraft {
  const rule = getAutoBuyRule(user.auto_buy_settings, resourceKey);

  return {
    thresholdInput: String(rule.threshold),
    scaleMode: rule.scaleMode,
    scaleValueInput: toDisplayedScaleValue(
      resourceKey,
      user,
      rule.scaleMode,
      rule.scaleValue,
    ),
  };
}

function buildDrafts(user: User): Record<AutoBuyResourceKey, AutoBuyRuleDraft> {
  return Object.fromEntries(
    managedResourceKeys.map((resourceKey) => [
      resourceKey,
      buildRuleDraft(resourceKey, user),
    ]),
  ) as Record<AutoBuyResourceKey, AutoBuyRuleDraft>;
}

function buildManagedAutoBuyResource(
  resourceKey: AutoBuyResourceKey,
  user: User,
  manualPrintQuantity: number,
  draft: AutoBuyRuleDraft,
): ManagedAutoBuyResource {
  const currentRule = getAutoBuyRule(user.auto_buy_settings, resourceKey);
  const spendResourceType = getSpendResourceType(resourceKey, user);
  const spendResourceLabel = getResourceDisplayLabel(spendResourceType);
  const spendResourceNoun = getResourceDisplayNoun(spendResourceType);
  const managedResourceType = getManagedResourceType(resourceKey, user);
  const managedResourceLabel = getResourceDisplayLabel(managedResourceType);
  const normalizedThreshold = clampThresholdInput(draft.thresholdInput);
  const normalizedScaleValue = toInternalScaleValue(
    resourceKey,
    user,
    draft.scaleMode,
    draft.scaleValueInput,
  );
  const usesCustomScaleValue = isCustomScaleMode(draft.scaleMode);
  const hasDraftChanges =
    normalizedThreshold !== currentRule.threshold ||
    draft.scaleMode !== currentRule.scaleMode ||
    normalizedScaleValue !== currentRule.scaleValue;

  if (resourceKey === AutoBuyResourceKey.PRINTER_SUPPLIES) {
    const maxSpendGold = Math.min(
      user.gold ?? 0,
      getMaxSuppliesPurchaseGold(user),
    );
    const previewSpendGold = resolveAutoBuySpendAmount(
      {
        threshold: normalizedThreshold,
        scaleMode: draft.scaleMode,
        scaleValue: normalizedScaleValue,
      },
      user.gold ?? 0,
      maxSpendGold,
    );
    const previewSupplies = getBuySuppliesGainForGold(previewSpendGold);
    const triggerFloor = Math.max(normalizedThreshold, manualPrintQuantity);

    return {
      key: resourceKey,
      title: managedResourceLabel,
      thresholdLabel: `${managedResourceLabel} threshold`,
      scaleLabel: `${managedResourceLabel} scale`,
      customScaleLabel:
        draft.scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT
          ? `${spendResourceLabel} custom percent`
          : `${spendResourceLabel} custom value`,
      thresholdHelperText:
        "Attempt a refill once supplies dip below this floor.",
      scaleHelperText: `Choose how aggressively auto-buy spends ${spendResourceNoun}.`,
      customHelperText:
        draft.scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT
          ? `Rounded and clamped to 1-100% of available ${spendResourceNoun}.`
          : `Spend a fixed amount of ${spendResourceNoun} when the rule triggers.`,
      currentValue: user.printer_supplies,
      currentValueSuffix: "supplies",
      triggerFloor,
      triggerDescription: "Threshold or print batch, whichever is higher",
      previewValue: `${formatNumber(previewSpendGold)} gold`,
      previewDescription: `${formatNumber(previewSupplies)} supplies at the current batch cap`,
      summaryText: `The current rule will try to spend ${formatNumber(previewSpendGold)} gold for ${formatNumber(previewSupplies)} supplies whenever stock falls short.`,
      normalizedThreshold,
      normalizedScaleValue,
      hasDraftChanges,
      usesCustomScaleValue,
      saveButtonLabel: "Save printer supplies settings",
    };
  }

  const maxGoldQuantity = getMaxAffordableGoldQuantity(user);
  const previewGoldQuantity = resolveAutoBuySpendAmount(
    {
      threshold: normalizedThreshold,
      scaleMode: draft.scaleMode,
      scaleValue: normalizedScaleValue,
    },
    maxGoldQuantity,
    maxGoldQuantity,
  );
  const previewSpendMoney =
    getOperationCost(operations[OperationId.BUY_GOLD], {
      user,
      params: { quantity: previewGoldQuantity },
    })[ResourceType.MONEY] ?? 0;

  return {
    key: resourceKey,
    title: managedResourceLabel,
    thresholdLabel: `${managedResourceLabel} threshold`,
    scaleLabel: `${managedResourceLabel} scale`,
    customScaleLabel:
      draft.scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT
        ? `${spendResourceLabel} custom percent`
        : `${spendResourceLabel} custom value`,
    thresholdHelperText:
      "Attempt a gold purchase once reserves dip below this floor.",
    scaleHelperText: `Choose how aggressively auto-buy spends ${spendResourceNoun}.`,
    customHelperText:
      draft.scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT
        ? `Rounded to whole purchases and clamped to 1-100% of available ${spendResourceNoun}.`
        : `Spend a fixed amount of ${spendResourceNoun} when the rule triggers.`,
    currentValue: user.gold,
    currentValueSuffix: "gold",
    triggerFloor: normalizedThreshold,
    triggerDescription: "Threshold-driven reserve target",
    previewValue: `${formatNumber(previewSpendMoney)} money`,
    previewDescription: `${formatNumber(previewGoldQuantity)} gold at the current rate`,
    summaryText: `The current rule will try to buy ${formatNumber(previewGoldQuantity)} gold for ${formatNumber(previewSpendMoney)} money whenever reserves dip below the configured floor.`,
    normalizedThreshold,
    normalizedScaleValue,
    hasDraftChanges,
    usesCustomScaleValue,
    saveButtonLabel: "Save gold settings",
  };
}

export function DashboardAutoBuyManagementPanel({
  hasLiveUser,
  manualPrintQuantity,
  user,
}: DashboardAutoBuyManagementPanelProps) {
  const headingId = useId();
  const descriptionId = useId();
  const [drafts, setDrafts] = useState<
    Record<AutoBuyResourceKey, AutoBuyRuleDraft>
  >(() => buildDrafts(user));
  const { configureAutoBuy, isLoading, toggleAutoBuySupplies } =
    useOperations();

  useEffect(() => {
    setDrafts(buildDrafts(user));
  }, [user.auto_buy_settings]);

  const managedResources = managedResourceKeys.map((resourceKey) =>
    buildManagedAutoBuyResource(
      resourceKey,
      user,
      manualPrintQuantity,
      drafts[resourceKey],
    ),
  );
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

  const updateDraft = (
    resourceKey: AutoBuyResourceKey,
    updates: Partial<AutoBuyRuleDraft>,
  ) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [resourceKey]: {
        ...currentDrafts[resourceKey],
        ...updates,
      },
    }));
  };

  const saveRule = (resourceKey: AutoBuyResourceKey) => {
    const resource = managedResources.find(
      (candidate) => candidate.key === resourceKey,
    );

    if (!resource) {
      return;
    }

    configureAutoBuy({
      resourceKey,
      threshold: resource.normalizedThreshold,
      scaleMode: drafts[resourceKey].scaleMode,
      scaleValue: resource.normalizedScaleValue,
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

          <Stack spacing={2}>
            {managedResources.map((resource) => (
              <Box
                key={resource.key}
                sx={{
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  p: { xs: 2, sm: 2.5 },
                }}
              >
                <Stack spacing={2.5}>
                  <Typography variant="h6" fontWeight={700}>
                    {resource.title}
                  </Typography>

                  <MetricsRow>
                    <MetricCard>
                      <Typography variant="subtitle2" color="text.secondary">
                        Resource
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {resource.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current stock {formatNumber(resource.currentValue)}{" "}
                        {resource.currentValueSuffix}
                      </Typography>
                    </MetricCard>

                    <MetricCard>
                      <Typography variant="subtitle2" color="text.secondary">
                        Trigger floor
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {formatNumber(resource.triggerFloor)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {resource.triggerDescription}
                      </Typography>
                    </MetricCard>

                    <MetricCard>
                      <Typography variant="subtitle2" color="text.secondary">
                        Preview action
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {resource.previewValue}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {resource.previewDescription}
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
                      label={resource.thresholdLabel}
                      type="number"
                      value={drafts[resource.key].thresholdInput}
                      onChange={(event) =>
                        updateDraft(resource.key, {
                          thresholdInput: event.target.value,
                        })
                      }
                      inputProps={{ min: 0, step: 1 }}
                      disabled={!canManage || isLoading}
                      helperText={resource.thresholdHelperText}
                    />

                    <TextField
                      select
                      label={resource.scaleLabel}
                      value={drafts[resource.key].scaleMode}
                      onChange={(event) => {
                        const nextScaleMode = event.target
                          .value as AutoBuyScaleMode;
                        const currentScaleValueInput =
                          drafts[resource.key].scaleValueInput;

                        updateDraft(resource.key, {
                          scaleMode: nextScaleMode,
                          scaleValueInput: !isCustomScaleMode(nextScaleMode)
                            ? ""
                            : currentScaleValueInput.trim() === ""
                              ? "1"
                              : currentScaleValueInput,
                        });
                      }}
                      disabled={!canManage || isLoading}
                      helperText={resource.scaleHelperText}
                    >
                      {scaleOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label={resource.customScaleLabel}
                      type="number"
                      value={drafts[resource.key].scaleValueInput}
                      onChange={(event) =>
                        updateDraft(resource.key, {
                          scaleValueInput: event.target.value,
                        })
                      }
                      inputProps={{
                        min: getCustomValueMinimum(
                          resource.key,
                          user,
                          drafts[resource.key].scaleMode,
                        ),
                        max:
                          drafts[resource.key].scaleMode ===
                          AutoBuyScaleMode.CUSTOM_PERCENT
                            ? 100
                            : undefined,
                        step: 1,
                      }}
                      disabled={
                        !canManage ||
                        isLoading ||
                        !resource.usesCustomScaleValue
                      }
                      helperText={resource.customHelperText}
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
                        {resource.summaryText}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      onClick={() => saveRule(resource.key)}
                      disabled={
                        !canManage || isLoading || !resource.hasDraftChanges
                      }
                    >
                      {resource.saveButtonLabel}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                {canManage
                  ? "Pause or resume the entire auto-buy engine without leaving the management panel."
                  : hasLiveUser
                    ? "Unlock auto-buy supplies in the shop before adjusting these policies."
                    : "Preview mode shows the policy shape, but live changes are disabled until an account is connected."}
              </Typography>
            </Box>

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
          </Stack>
        </Stack>
      </PanelCard>
    </Box>
  );
}
