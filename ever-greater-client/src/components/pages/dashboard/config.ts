import type { User } from "../../../api/auth";
import type { PanelLabel, PanelState, PresetId } from "./types";

export const defaultPanels: PanelState = {
  account: true,
  ticket: true,
  print: true,
  shop: true,
  status: true,
  insights: true,
};

export const presets: Record<PresetId, PanelState> = {
  focused: {
    account: true,
    ticket: true,
    print: true,
    shop: false,
    status: true,
    insights: false,
  },
  balanced: {
    account: true,
    ticket: true,
    print: true,
    shop: true,
    status: true,
    insights: false,
  },
  expanded: defaultPanels,
};

export const presetIds: PresetId[] = ["focused", "balanced", "expanded"];

export const panelLabels: PanelLabel[] = [
  { id: "account", label: "Account" },
  { id: "ticket", label: "Ticket Pool" },
  { id: "print", label: "Print Controls" },
  { id: "shop", label: "Shop Modules" },
  { id: "status", label: "Realtime Health" },
  { id: "insights", label: "Insights" },
];

export const LATE_UPDATE_MS = 7000;

export const previewDashboardUser: User = {
  id: 0,
  email: "operator@evergreater.app",
  tickets_contributed: 12840,
  tickets_withdrawn: 1620,
  printer_supplies: 128,
  money: 245000,
  gold: 164,
  autoprinters: 6,
  credit_value: 2400,
  credit_generation_level: 9,
  credit_capacity_level: 7,
  manual_print_batch_level: 0,
  supplies_batch_level: 2,
  auto_buy_supplies_purchased: true,
  auto_buy_supplies_active: true,
};
