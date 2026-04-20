import {
  OperationId,
  ResourceType,
  canAfford,
  getOperationCost,
  operations,
  type User,
} from "ever-greater-shared";
import { LATE_UPDATE_MS, previewDashboardUser } from "./config";
import type { SignalColor } from "./types";

export type DashboardRealtimeState = {
  hasLiveUser: boolean;
  isConnected: boolean;
  isReconnecting: boolean;
  lastUpdateAt: number | null;
  clock: number;
};

export type DashboardBaseState = {
  user: User | null;
  count: number;
  isTicketLoading: boolean;
  supplies: number;
  isPrintDisabled: boolean;
};

export type DashboardViewModel = {
  hasLiveUser: boolean;
  dashboardUser: User;
  globalTicketCount: number;
  ticketsContributed: number;
  ticketsWithdrawn: number;
  remainingCapacity: number;
  isAutoBuyActive: boolean;
  visibleSupplies: number;
  printButtonDisabled: boolean;
  signalState: "healthy" | "late" | "disconnected" | "preview";
  signalLabel: string;
  signalColor: SignalColor;
  suppliesCost: number;
  autoBuyCost: number;
  creditGenerationCost: number;
  autoprinterCost: number;
  creditCapacityCost: number;
  goldUnitCost: number;
  canAffordCreditCapacity: boolean;
  canAffordAutoprinter: boolean;
  poolMomentum: number;
  automationMix: number;
  bestWindow: string;
  suggestedFocus: string;
  poolTrend: string;
};

export function getDashboardSignalState({
  hasLiveUser,
  isConnected,
  isReconnecting,
  lastUpdateAt,
  clock,
}: DashboardRealtimeState): DashboardViewModel["signalState"] {
  if (!hasLiveUser) {
    return "preview";
  }

  if (!isConnected) {
    return "disconnected";
  }

  if (
    isReconnecting ||
    !lastUpdateAt ||
    clock - lastUpdateAt > LATE_UPDATE_MS
  ) {
    return "late";
  }

  return "healthy";
}

export function buildDashboardViewModel(
  baseState: DashboardBaseState,
  realtimeState: Omit<DashboardRealtimeState, "hasLiveUser"> & {
    hasLiveUser?: boolean;
  },
): DashboardViewModel {
  const hasLiveUser = realtimeState.hasLiveUser ?? Boolean(baseState.user);
  const dashboardUser = baseState.user ?? previewDashboardUser;
  const globalTicketCount = hasLiveUser ? baseState.count : 1842750;
  const ticketsContributed = dashboardUser.tickets_contributed ?? 0;
  const ticketsWithdrawn = dashboardUser.tickets_withdrawn ?? 0;
  const remainingCapacity = Math.max(0, ticketsContributed - ticketsWithdrawn);
  const isAutoBuyActive =
    dashboardUser.auto_buy_supplies_purchased &&
    dashboardUser.auto_buy_supplies_active;
  const visibleSupplies = hasLiveUser
    ? baseState.supplies
    : dashboardUser.printer_supplies;
  const printButtonDisabled = hasLiveUser ? baseState.isPrintDisabled : true;

  const signalState = getDashboardSignalState({
    hasLiveUser,
    isConnected: realtimeState.isConnected,
    isReconnecting: realtimeState.isReconnecting,
    lastUpdateAt: realtimeState.lastUpdateAt,
    clock: realtimeState.clock,
  });

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

  return {
    hasLiveUser,
    dashboardUser,
    globalTicketCount,
    ticketsContributed,
    ticketsWithdrawn,
    remainingCapacity,
    isAutoBuyActive,
    visibleSupplies,
    printButtonDisabled,
    signalState,
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
  };
}
