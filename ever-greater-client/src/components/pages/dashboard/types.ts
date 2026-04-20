export type PanelId =
  | "account"
  | "ticket"
  | "print"
  | "autoBuy"
  | "shop"
  | "status"
  | "insights";

export type PanelState = Record<PanelId, boolean>;

export type PresetId = "focused" | "balanced" | "expanded";

export type SignalColor = "default" | "error" | "success" | "warning";

export type DashboardPageProps = {
  showControls?: boolean;
};

export type PanelLabel = {
  id: PanelId;
  label: string;
};
