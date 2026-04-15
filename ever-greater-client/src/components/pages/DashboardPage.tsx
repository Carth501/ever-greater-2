import {} from "ever-greater-shared";
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
} from "./dashboard";
import { defaultPanels, presets } from "./dashboard/config";
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
} from "./dashboard/types";
import { buildDashboardViewModel } from "./dashboard/viewModel";

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

  const {
    hasLiveUser,
    dashboardUser,
    globalTicketCount,
    ticketsContributed,
    ticketsWithdrawn,
    remainingCapacity,
    isAutoBuyActive,
    visibleSupplies,
    printButtonDisabled,
    signalLabel,
    signalColor,
    suppliesCost,
    autoBuyCost,
    creditGenerationCost,
    autoprinterCost,
    creditCapacityCost,
    goldUnitCost,
    canAffordCreditCapacity,
    canAffordAutoprinter,
    poolMomentum,
    automationMix,
    bestWindow,
    suggestedFocus,
    poolTrend,
  } = useMemo(
    () =>
      buildDashboardViewModel(
        {
          user,
          count,
          isTicketLoading,
          supplies,
          isPrintDisabled,
        },
        {
          isConnected,
          isReconnecting,
          lastUpdateAt,
          clock,
        },
      ),
    [
      clock,
      count,
      isConnected,
      isPrintDisabled,
      isReconnecting,
      isTicketLoading,
      lastUpdateAt,
      supplies,
      user,
    ],
  );

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
