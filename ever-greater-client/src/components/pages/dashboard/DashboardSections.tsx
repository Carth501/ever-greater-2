import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BoltIcon from "@mui/icons-material/Bolt";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import InsightsIcon from "@mui/icons-material/Insights";
import LayersIcon from "@mui/icons-material/Layers";
import PaletteIcon from "@mui/icons-material/Palette";
import SensorsIcon from "@mui/icons-material/Sensors";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { ShopGroup, ShopRow } from "../../shop/shop-groups/ShopGroupLayout";
import { panelLabels } from "./config";
import {
  formatNumber,
  formatPresetLabel,
  formatSignedValue,
  formatTimestamp,
} from "./helpers";
import {
  AccentPanel,
  FeatureStrip,
  HeroCard,
  HeroGrid,
  InsightGrid,
  MetricCard,
  MetricsRow,
  PanelCard,
  Pill,
  PrintZone,
  StatusList,
  StatusRow,
  ToolbarCard,
} from "./styles";
import type { PanelState, PresetId, SignalColor } from "./types";

type DashboardHeroSectionProps = {
  activePreset: PresetId;
  onPresetChange: (presetId: PresetId) => void;
  visiblePanelsCount: number;
};

export function DashboardHeroSection({
  activePreset,
  onPresetChange,
  visiblePanelsCount,
}: DashboardHeroSectionProps) {
  return (
    <HeroCard elevation={0}>
      <HeroGrid>
        <Stack spacing={2.5}>
          <Pill>
            <PaletteIcon fontSize="small" />
            <Typography variant="subtitle2">
              Dashboard preview: modular operator system
            </Typography>
          </Pill>
          <Typography variant="h2" sx={{ maxWidth: 760 }}>
            A cleaner command center for printing, monitoring, and upgrading
            without locking the user into one rigid layout.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
            This dashboard keeps the current dark MUI foundation, preserves the
            branded footer, and promotes #4080C0 into a sharper accent system
            for action, status, and layout emphasis.
          </Typography>
          <FeatureStrip>
            <MetricCard>
              <Stack spacing={1}>
                <DashboardCustomizeIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Toggleable Modules
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Panels can be shown or hidden based on workflow, from a
                  focused print view to a denser operator dashboard.
                </Typography>
              </Stack>
            </MetricCard>
            <MetricCard>
              <Stack spacing={1}>
                <PaletteIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Accent Reuse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  #4080C0 moves beyond the footer into active chips, CTA
                  emphasis, structural borders, and signal highlights.
                </Typography>
              </Stack>
            </MetricCard>
            <MetricCard>
              <Stack spacing={1}>
                <LayersIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Modular Structure
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Existing group patterns remain useful, especially for shop
                  surfaces that can expand, collapse, or be docked separately.
                </Typography>
              </Stack>
            </MetricCard>
          </FeatureStrip>
        </Stack>

        <AccentPanel elevation={0}>
          <Stack spacing={2} sx={{ height: "100%", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="overline" color="primary.light">
                Current default capture
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.75 }}>
                Expanded operator layout
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
                Designed for the user who wants ticket metrics, printing, shop
                decisions, and system health visible in one frame.
              </Typography>
            </Box>

            <MetricsRow>
              <MetricCard>
                <Typography variant="subtitle2" color="text.secondary">
                  Visible Panels
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {visiblePanelsCount}
                </Typography>
              </MetricCard>
              <MetricCard>
                <Typography variant="subtitle2" color="text.secondary">
                  Primary Accent
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  #4080C0
                </Typography>
              </MetricCard>
              <MetricCard>
                <Typography variant="subtitle2" color="text.secondary">
                  Stack Basis
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  React + MUI
                </Typography>
              </MetricCard>
            </MetricsRow>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {(["focused", "balanced", "expanded"] as PresetId[]).map((presetId) => (
                <Chip
                  key={presetId}
                  label={formatPresetLabel(presetId)}
                  color={activePreset === presetId ? "primary" : "default"}
                  onClick={() => onPresetChange(presetId)}
                  variant={activePreset === presetId ? "filled" : "outlined"}
                />
              ))}
            </Stack>
          </Stack>
        </AccentPanel>
      </HeroGrid>
    </HeroCard>
  );
}

type DashboardToolbarSectionProps = {
  activePreset: PresetId;
  panels: PanelState;
  onPresetChange: (presetId: PresetId) => void;
  onTogglePanel: (panelId: keyof PanelState) => void;
};

export function DashboardToolbarSection({
  activePreset,
  panels,
  onPresetChange,
  onTogglePanel,
}: DashboardToolbarSectionProps) {
  return (
    <ToolbarCard elevation={0}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Panel visibility
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Compose the dashboard around the user’s preferred workflow
              without changing the underlying visual system.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {(["focused", "balanced", "expanded"] as PresetId[]).map((presetId) => (
              <Chip
                key={`toolbar-${presetId}`}
                label={`${formatPresetLabel(presetId)} preset`}
                color={activePreset === presetId ? "primary" : "default"}
                onClick={() => onPresetChange(presetId)}
                variant={activePreset === presetId ? "filled" : "outlined"}
              />
            ))}
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 1.5,
          }}
        >
          {panelLabels.map((panel) => (
            <Box
              key={panel.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: 3,
                border: (theme) =>
                  `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                backgroundColor: (theme) => alpha(theme.palette.common.white, 0.02),
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {panel.label}
              </Typography>
              <Switch
                checked={panels[panel.id]}
                onChange={() => onTogglePanel(panel.id)}
                color="primary"
              />
            </Box>
          ))}
        </Box>
      </Stack>
    </ToolbarCard>
  );
}

type DashboardAccountPanelProps = {
  hasLiveUser: boolean;
  signalColor: SignalColor;
  signalLabel: string;
  userEmail: string;
};

export function DashboardAccountPanel({
  hasLiveUser,
  signalColor,
  signalLabel,
  userEmail,
}: DashboardAccountPanelProps) {
  return (
    <PanelCard elevation={0}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Signed in as
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {userEmail}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end">
            <Chip
              icon={<SensorsIcon />}
              label={signalLabel}
              color={signalColor}
              variant="outlined"
            />
            <Chip
              icon={<AutoAwesomeIcon />}
              label={hasLiveUser ? "Live data bound" : "Preview fallback active"}
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Stack>
      </Stack>
    </PanelCard>
  );
}

type DashboardTicketPanelProps = {
  globalTicketCount: number;
  hasLiveUser: boolean;
  isTicketLoading: boolean;
  poolMomentum: number;
  remainingCapacity: number;
  ticketsContributed: number;
  ticketsWithdrawn: number;
};

export function DashboardTicketPanel({
  globalTicketCount,
  hasLiveUser,
  isTicketLoading,
  poolMomentum,
  remainingCapacity,
  ticketsContributed,
  ticketsWithdrawn,
}: DashboardTicketPanelProps) {
  return (
    <AccentPanel elevation={0}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="subtitle2" color="primary.light">
            Ticket pool overview
          </Typography>
          <Typography variant="h2" fontWeight={700} sx={{ mt: 0.75 }}>
            {isTicketLoading && hasLiveUser ? "Syncing..." : formatNumber(globalTicketCount)}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Tickets contributed: {formatNumber(ticketsContributed)}
          </Typography>
        </Box>

        <MetricsRow>
          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              24h Withdrawals
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatNumber(ticketsWithdrawn)}
            </Typography>
          </MetricCard>
          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              Remaining Capacity
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatNumber(remainingCapacity)}
            </Typography>
          </MetricCard>
          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              Pool Momentum
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatSignedValue(poolMomentum)}
            </Typography>
          </MetricCard>
        </MetricsRow>
      </Stack>
    </AccentPanel>
  );
}

type DashboardPrintPanelProps = {
  hasLiveUser: boolean;
  isAutoBuyActive: boolean;
  onPrintTicket?: () => void;
  printButtonDisabled: boolean;
  visibleSupplies: number;
};

export function DashboardPrintPanel({
  hasLiveUser,
  isAutoBuyActive,
  onPrintTicket,
  printButtonDisabled,
  visibleSupplies,
}: DashboardPrintPanelProps) {
  return (
    <PanelCard elevation={0}>
      <Stack spacing={2.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Print controls
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The primary action stays obvious even when more panels are
              enabled.
            </Typography>
          </Box>
          <Chip
            icon={<BoltIcon />}
            label={hasLiveUser ? "Live action" : "Preview only"}
            color="primary"
          />
        </Stack>

        <PrintZone>
          <AccentPanel elevation={0}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="primary.light">
                Main action
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {hasLiveUser
                  ? "This button reflects the real disabled state from the store and can use the current print handler when live data is available."
                  : "Printing remains the clearest call to action, with the accent color reserved for the highest-priority interaction."}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={hasLiveUser ? onPrintTicket : undefined}
                disabled={printButtonDisabled}
                sx={{ alignSelf: "flex-start", minWidth: 220 }}
              >
                Print a ticket
              </Button>
            </Stack>
          </AccentPanel>

          <PanelCard elevation={0}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Supplies
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {formatNumber(visibleSupplies)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {visibleSupplies === 0
                  ? "No supplies available. Printing is blocked until stock is restored."
                  : isAutoBuyActive
                    ? "Auto-buy is active. Stock can recover without leaving the main workflow."
                    : "Supplies are live from the current user state. Enable automation to reduce refill interruptions."}
              </Typography>
            </Stack>
          </PanelCard>
        </PrintZone>
      </Stack>
    </PanelCard>
  );
}

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
  return (
    <PanelCard elevation={0}>
      <Stack spacing={2.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Modular shop surfaces
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Shop groups become independent cards that can be docked together
              or hidden when the user wants a cleaner print-focused layout.
            </Typography>
          </Box>
          <Chip icon={<LayersIcon />} label="Dockable groups" variant="outlined" color="primary" />
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
              <Chip label={`${formatNumber(suppliesCost)} gold`} color="primary" size="small" />
            </ShopRow>
            <ShopRow>
              <Typography variant="body2">Auto-buy unlock</Typography>
              <Chip
                label={autoBuySuppliesPurchased ? "Unlocked" : `${formatNumber(autoBuyCost)} gold`}
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
              <Chip label={`${formatNumber(autoprinters)} active`} color="primary" size="small" />
            </ShopRow>
            <ShopRow>
              <Typography variant="body2">Capacity upgrade</Typography>
              <Chip label={`${formatNumber(creditCapacityCost)} tickets`} color="default" size="small" />
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
              <Chip label={`${formatNumber(goldUnitCost)} money / gold`} color="default" size="small" />
            </ShopRow>
            <ShopRow>
              <Typography variant="body2">Recommended next buy</Typography>
              <Chip label={suggestedFocus} color="warning" size="small" />
            </ShopRow>
            <ShopRow>
              <Typography variant="body2">Panel mode</Typography>
              <Chip label={hasLiveUser ? "Live-bound" : "Compact"} color="primary" size="small" />
            </ShopRow>
          </ShopGroup>
        </Box>
      </Stack>
    </PanelCard>
  );
}

type DashboardStatusPanelProps = {
  hasLiveUser: boolean;
  lastUpdateAt: number | null;
  signalColor: SignalColor;
  signalLabel: string;
};

export function DashboardStatusPanel({
  hasLiveUser,
  lastUpdateAt,
  signalColor,
  signalLabel,
}: DashboardStatusPanelProps) {
  return (
    <PanelCard elevation={0}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <SensorsIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Realtime health
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Compact enough to stay visible, detailed enough to remain useful.
            </Typography>
          </Box>
        </Stack>

        <StatusList>
          <StatusRow>
            <Typography variant="body2">Connection</Typography>
            <Chip label={signalLabel} color={signalColor} size="small" />
          </StatusRow>
          <StatusRow>
            <Typography variant="body2">Last update</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatTimestamp(lastUpdateAt)}
            </Typography>
          </StatusRow>
          <StatusRow>
            <Typography variant="body2">Recovery strategy</Typography>
            <Typography variant="body2" color="text.secondary">
              {hasLiveUser ? "Auto reconnect" : "Preview snapshot"}
            </Typography>
          </StatusRow>
        </StatusList>
      </Stack>
    </PanelCard>
  );
}

type DashboardInsightsPanelProps = {
  automationMix: number;
  bestWindow: string;
  poolTrend: string;
  suggestedFocus: string;
};

export function DashboardInsightsPanel({
  automationMix,
  bestWindow,
  poolTrend,
  suggestedFocus,
}: DashboardInsightsPanelProps) {
  return (
    <PanelCard elevation={0}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <InsightsIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Secondary insights
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Optional panels can provide guidance without overwhelming the
              default layout.
            </Typography>
          </Box>
        </Stack>

        <InsightGrid>
          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              Best earning window
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {bestWindow}
            </Typography>
          </MetricCard>
          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              Automation mix
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {formatSignedValue(automationMix).replace("+", "")}
            </Typography>
          </MetricCard>
          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              Suggested focus
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {suggestedFocus}
            </Typography>
          </MetricCard>
          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              Pool trend
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {poolTrend}
            </Typography>
          </MetricCard>
        </InsightGrid>
      </Stack>
    </PanelCard>
  );
}

export function DashboardSummaryPanel() {
  return (
    <AccentPanel elevation={0}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <TrendingUpIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Why this dashboard works
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          The interface feels more intentional because the main action,
          supporting metrics, and optional panels each have distinct visual
          weight. The user can simplify the surface without losing the core
          workflow.
        </Typography>
      </Stack>
    </AccentPanel>
  );
}
