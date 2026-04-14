import {
  OperationId,
  ResourceType,
  canAfford,
  getOperationCost,
  operations,
} from "ever-greater-shared";
import { useEffect, useMemo, useState, type JSX } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import { useRealtime } from "../../hooks/useRealtime";
import {
  DashboardAccountPanel,
  DashboardHeroSection,
  DashboardInsightsPanel,
  DashboardPrintPanel,
  DashboardShopPanel,
  DashboardStatusPanel,
  DashboardSummaryPanel,
  DashboardTicketPanel,
  DashboardToolbarSection,
} from "./dashboard/DashboardSections";
import {
  LATE_UPDATE_MS,
  defaultPanels,
  presets,
  previewDashboardUser,
} from "./dashboard/config";
import {
  Grid,
  LeftColumn,
  PageRoot,
  RightColumn,
  Shell,
} from "./dashboard/styles";
import type {
  DashboardPageProps,
  PanelId,
  PanelState,
  PresetId,
  SignalColor,
} from "./dashboard/types";

function DashboardPage({
  showControls = true,
}: DashboardPageProps): JSX.Element {
  const { user } = useAuth();
  const {
    count,
    isLoading: isTicketLoading,
    supplies,
    isPrintDisabled,
    printTicket,
  } = useGame();
  const { isConnected, isReconnecting, lastUpdateAt } = useRealtime();
  const [activePreset, setActivePreset] = useState<PresetId>("expanded");
  const [panels, setPanels] = useState<PanelState>(defaultPanels);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  const hasLiveUser = Boolean(user);
  const dashboardUser = user ?? previewDashboardUser;

  const globalTicketCount = hasLiveUser ? count : 1842750;
  const ticketsContributed = dashboardUser.tickets_contributed ?? 0;
  const ticketsWithdrawn = dashboardUser.tickets_withdrawn ?? 0;
  const remainingCapacity = Math.max(0, ticketsContributed - ticketsWithdrawn);
  const isAutoBuyActive =
    dashboardUser.auto_buy_supplies_purchased &&
    dashboardUser.auto_buy_supplies_active;
  const visibleSupplies = hasLiveUser
    ? supplies
    : dashboardUser.printer_supplies;
  const printButtonDisabled = hasLiveUser ? isPrintDisabled : true;

  const signalState = useMemo(() => {
    if (!hasLiveUser) {
      return "preview" as const;
    }

    if (!isConnected) {
      return "disconnected" as const;
    }

    if (
      isReconnecting ||
      !lastUpdateAt ||
      clock - lastUpdateAt > LATE_UPDATE_MS
    ) {
      return "late" as const;
    }

    return "healthy" as const;
  }, [clock, hasLiveUser, isConnected, isReconnecting, lastUpdateAt]);

  const signalLabel =
    signalState === "healthy"
      ? "Realtime healthy"
      : signalState === "late"
        ? "Updates delayed"
        : signalState === "disconnected"
          ? "Realtime offline"
          : "Preview data";

  const signalColor: SignalColor =
    signalState === "healthy"
      ? "success"
      : signalState === "late"
        ? "warning"
        : signalState === "disconnected"
          ? "error"
          : "default";

  const operationContext = { user: dashboardUser };
  const suppliesCost =
    getOperationCost(operations[OperationId.BUY_SUPPLIES], operationContext)[
      ResourceType.GOLD
    ] ?? 0;
  const autoBuyCost =
    getOperationCost(
      operations[OperationId.AUTO_BUY_SUPPLIES],
      operationContext,
    )[ResourceType.GOLD] ?? 0;
  const creditGenerationCost =
    getOperationCost(
      operations[OperationId.INCREASE_CREDIT_GENERATION],
      operationContext,
    )[ResourceType.GOLD] ?? 0;
  const autoprinterCost =
    getOperationCost(operations[OperationId.BUY_AUTOPRINTER], operationContext)[
      ResourceType.CREDIT
    ] ?? 0;
  const creditCapacityCost =
    getOperationCost(
      operations[OperationId.INCREASE_CREDIT_CAPACITY],
      operationContext,
    )[ResourceType.GLOBAL_TICKETS] ?? 0;
  const goldUnitCost =
    getOperationCost(operations[OperationId.BUY_GOLD], {
      user: dashboardUser,
      params: { quantity: 1 },
    })[ResourceType.MONEY] ?? 0;
  const canAffordCreditCapacity =
    canAfford(dashboardUser, {
      [ResourceType.GLOBAL_TICKETS]: creditCapacityCost,
    }) && remainingCapacity >= creditCapacityCost;
  const canAffordAutoprinter = canAfford(dashboardUser, {
    [ResourceType.CREDIT]: autoprinterCost,
  });

  const poolMomentum =
    ticketsContributed > 0
      ? ((remainingCapacity - ticketsWithdrawn) / ticketsContributed) * 100
      : 0;
  const automationMix =
    dashboardUser.autoprinters > 0 || isAutoBuyActive
      ? Math.min(
          100,
          dashboardUser.autoprinters * 10 + (isAutoBuyActive ? 18 : 0),
        )
      : 0;
  const bestWindow =
    visibleSupplies > 0
      ? isAutoBuyActive
        ? "Active now"
        : "Next refill cycle"
      : "Refill needed";
  const suggestedFocus =
    visibleSupplies === 0
      ? "Refill supplies"
      : !dashboardUser.auto_buy_supplies_purchased
        ? "Unlock auto-buy"
        : remainingCapacity < creditCapacityCost
          ? "Contribute more tickets"
          : canAffordCreditCapacity
            ? "Capacity upgrades"
            : "Grow gold reserves";
  const poolTrend =
    signalState === "healthy"
      ? "Live updates"
      : signalState === "late"
        ? "Monitoring delay"
        : signalState === "disconnected"
          ? "Offline snapshot"
          : "Preview snapshot";

  const visiblePanelsCount = useMemo(
    () => Object.values(panels).filter(Boolean).length,
    [panels],
  );

  function applyPreset(presetId: PresetId) {
    setActivePreset(presetId);
    setPanels(presets[presetId]);
  }

  function togglePanel(panelId: PanelId) {
    setActivePreset("expanded");
    setPanels((currentPanels) => ({
      ...currentPanels,
      [panelId]: !currentPanels[panelId],
    }));
  }

  return (
    <PageRoot>
      <Shell>
        <DashboardHeroSection
          activePreset={activePreset}
          onPresetChange={applyPreset}
          visiblePanelsCount={visiblePanelsCount}
        />

        {showControls && (
          <DashboardToolbarSection
            activePreset={activePreset}
            panels={panels}
            onPresetChange={applyPreset}
            onTogglePanel={togglePanel}
          />
        )}

        <Grid>
          <LeftColumn>
            {panels.account && (
              <DashboardAccountPanel
                hasLiveUser={hasLiveUser}
                signalColor={signalColor}
                signalLabel={signalLabel}
                userEmail={dashboardUser.email}
              />
            )}

            {panels.ticket && (
              <DashboardTicketPanel
                globalTicketCount={globalTicketCount}
                hasLiveUser={hasLiveUser}
                isTicketLoading={isTicketLoading}
                poolMomentum={poolMomentum}
                remainingCapacity={remainingCapacity}
                ticketsContributed={ticketsContributed}
                ticketsWithdrawn={ticketsWithdrawn}
              />
            )}

            {panels.print && (
              <DashboardPrintPanel
                hasLiveUser={hasLiveUser}
                isAutoBuyActive={isAutoBuyActive}
                onPrintTicket={printTicket}
                printButtonDisabled={printButtonDisabled}
                visibleSupplies={visibleSupplies}
              />
            )}

            {panels.shop && (
              <DashboardShopPanel
                autoBuyCost={autoBuyCost}
                autoprinters={dashboardUser.autoprinters}
                autoBuySuppliesPurchased={
                  dashboardUser.auto_buy_supplies_purchased
                }
                canAffordAutoprinter={canAffordAutoprinter}
                creditCapacityCost={creditCapacityCost}
                creditGenerationCost={creditGenerationCost}
                creditGenerationLevel={dashboardUser.credit_generation_level}
                goldUnitCost={goldUnitCost}
                hasLiveUser={hasLiveUser}
                suggestedFocus={suggestedFocus}
                suppliesCost={suppliesCost}
              />
            )}
          </LeftColumn>

          <RightColumn>
            {panels.status && (
              <DashboardStatusPanel
                hasLiveUser={hasLiveUser}
                lastUpdateAt={lastUpdateAt}
                signalColor={signalColor}
                signalLabel={signalLabel}
              />
            )}

            {panels.insights && (
              <DashboardInsightsPanel
                automationMix={automationMix}
                bestWindow={bestWindow}
                poolTrend={poolTrend}
                suggestedFocus={suggestedFocus}
              />
            )}

            <DashboardSummaryPanel />
          </RightColumn>
        </Grid>
      </Shell>
    </PageRoot>
  );
}

export default DashboardPage;
