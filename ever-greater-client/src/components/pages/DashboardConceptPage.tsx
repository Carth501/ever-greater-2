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
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import {
  OperationId,
  ResourceType,
  canAfford,
  getOperationCost,
  operations,
} from "ever-greater-shared";
import { useEffect, useMemo, useState, type JSX } from "react";
import type { User } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import { useRealtime } from "../../hooks/useRealtime";
import { ShopGroup, ShopRow } from "../shop/shop-groups/ShopGroupLayout";

type PanelId = "account" | "ticket" | "print" | "shop" | "status" | "insights";

type ConceptPageProps = {
  showControls?: boolean;
};

type PanelState = Record<PanelId, boolean>;

type PresetId = "focused" | "balanced" | "expanded";

const defaultPanels: PanelState = {
  account: true,
  ticket: true,
  print: true,
  shop: true,
  status: true,
  insights: true,
};

const presets: Record<PresetId, PanelState> = {
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
  expanded: {
    account: true,
    ticket: true,
    print: true,
    shop: true,
    status: true,
    insights: true,
  },
};

const panelLabels: Array<{ id: PanelId; label: string }> = [
  { id: "account", label: "Account" },
  { id: "ticket", label: "Ticket Pool" },
  { id: "print", label: "Print Controls" },
  { id: "shop", label: "Shop Modules" },
  { id: "status", label: "Realtime Health" },
  { id: "insights", label: "Insights" },
];

const LATE_UPDATE_MS = 7000;

const previewUser: User = {
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
  auto_buy_supplies_purchased: true,
  auto_buy_supplies_active: true,
};

const PageRoot = styled(Box)(({ theme }) => ({
  minHeight: "calc(100vh - 56px)",
  padding: theme.spacing(4, 0, 6),
  background:
    `radial-gradient(circle at top left, ${alpha(theme.palette.primary.main, 0.18)} 0%, transparent 35%), ` +
    `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
}));

const Shell = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
  width: "min(1280px, 100%)",
  margin: "0 auto",
  padding: theme.spacing(0, 3),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0, 2),
  },
}));

const HeroCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3.5),
  borderRadius: 24,
  border: `1px solid ${alpha(theme.palette.primary.light, 0.26)}`,
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 46%, ${alpha(theme.palette.secondary.dark, 0.94)} 100%)`,
  boxShadow: `0 18px 48px ${alpha(theme.palette.common.black, 0.28)}`,
  overflow: "hidden",
}));

const HeroGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 0.85fr)",
  gap: theme.spacing(3),
  alignItems: "stretch",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}));

const ToolbarCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.88),
  backdropFilter: "blur(14px)",
}));

const Grid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.6fr) minmax(300px, 0.95fr)",
  gap: theme.spacing(3),
  alignItems: "start",
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "1fr",
  },
}));

const LeftColumn = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

const RightColumn = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

const FeatureStrip = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}));

const PanelCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 22,
  backgroundColor: alpha(theme.palette.background.paper, 0.92),
  border: `1px solid ${alpha(theme.palette.common.white, 0.07)}`,
  boxShadow: `0 14px 30px ${alpha(theme.palette.common.black, 0.22)}`,
}));

const AccentPanel = styled(PanelCard)(({ theme }) => ({
  background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.34)}`,
}));

const MetricsRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

const MetricCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 18,
  backgroundColor: alpha(theme.palette.common.white, 0.03),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
}));

const PrintZone = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(220px, 0.8fr)",
  gap: theme.spacing(2),
  alignItems: "stretch",
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

const StatusList = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1.5),
}));

const StatusRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: 16,
  backgroundColor: alpha(theme.palette.common.white, 0.03),
  border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
}));

const InsightGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

const Pill = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(0.75, 1.25),
  borderRadius: 999,
  border: `1px solid ${alpha(theme.palette.primary.light, 0.24)}`,
  color: theme.palette.primary.light,
  backgroundColor: alpha(theme.palette.primary.main, 0.12),
}));

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatSignedValue(value: number): string {
  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }

  if (value < 0) {
    return `${value.toFixed(1)}%`;
  }

  return "0.0%";
}

function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) {
    return "Awaiting first update";
  }

  return new Date(timestamp).toLocaleTimeString();
}

function DashboardConceptPage({
  showControls = true,
}: ConceptPageProps): JSX.Element {
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
  const [panels, setPanels] = useState<PanelState>(presets.expanded);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  const hasLiveUser = Boolean(user);
  const conceptUser = user ?? previewUser;

  const globalTicketCount = hasLiveUser ? count : 1842750;
  const ticketsContributed = conceptUser.tickets_contributed ?? 0;
  const ticketsWithdrawn = conceptUser.tickets_withdrawn ?? 0;
  const remainingCapacity = Math.max(0, ticketsContributed - ticketsWithdrawn);
  const isAutoBuyActive =
    conceptUser.auto_buy_supplies_purchased &&
    conceptUser.auto_buy_supplies_active;
  const visibleSupplies = hasLiveUser ? supplies : conceptUser.printer_supplies;
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

  const signalColor =
    signalState === "healthy"
      ? "success"
      : signalState === "late"
        ? "warning"
        : signalState === "disconnected"
          ? "error"
          : "default";

  const operationContext = { user: conceptUser };
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
      user: conceptUser,
      params: { quantity: 1 },
    })[ResourceType.MONEY] ?? 0;
  const canAffordCreditCapacity =
    canAfford(conceptUser, {
      [ResourceType.GLOBAL_TICKETS]: creditCapacityCost,
    }) && remainingCapacity >= creditCapacityCost;

  const poolMomentum =
    ticketsContributed > 0
      ? ((remainingCapacity - ticketsWithdrawn) / ticketsContributed) * 100
      : 0;
  const automationMix =
    conceptUser.autoprinters > 0 || isAutoBuyActive
      ? Math.min(
          100,
          conceptUser.autoprinters * 10 + (isAutoBuyActive ? 18 : 0),
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
      : !conceptUser.auto_buy_supplies_purchased
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
        <HeroCard elevation={0}>
          <HeroGrid>
            <Stack spacing={2.5}>
              <Pill>
                <PaletteIcon fontSize="small" />
                <Typography variant="subtitle2">
                  Concept mode: modular dashboard system
                </Typography>
              </Pill>
              <Typography variant="h2" sx={{ maxWidth: 760 }}>
                A cleaner command center for printing, monitoring, and upgrading
                without locking the user into one rigid layout.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 720 }}
              >
                This concept keeps the current dark MUI foundation, preserves
                the branded footer, and promotes #4080C0 into a sharper accent
                system for action, status, and layout emphasis.
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
                      surfaces that can expand, collapse, or be docked
                      separately.
                    </Typography>
                  </Stack>
                </MetricCard>
              </FeatureStrip>
            </Stack>

            <AccentPanel elevation={0}>
              <Stack
                spacing={2}
                sx={{ height: "100%", justifyContent: "space-between" }}
              >
                <Box>
                  <Typography variant="overline" color="primary.light">
                    Current default capture
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 0.75 }}>
                    Expanded operator layout
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1.25 }}
                  >
                    Designed for the user who wants ticket metrics, printing,
                    shop decisions, and system health visible in one frame.
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
                  {(["focused", "balanced", "expanded"] as PresetId[]).map(
                    (presetId) => (
                      <Chip
                        key={presetId}
                        label={
                          presetId.charAt(0).toUpperCase() + presetId.slice(1)
                        }
                        color={
                          activePreset === presetId ? "primary" : "default"
                        }
                        onClick={() => applyPreset(presetId)}
                        variant={
                          activePreset === presetId ? "filled" : "outlined"
                        }
                      />
                    ),
                  )}
                </Stack>
              </Stack>
            </AccentPanel>
          </HeroGrid>
        </HeroCard>

        {showControls && (
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
                  {(["focused", "balanced", "expanded"] as PresetId[]).map(
                    (presetId) => (
                      <Chip
                        key={`toolbar-${presetId}`}
                        label={`${presetId.charAt(0).toUpperCase() + presetId.slice(1)} preset`}
                        color={
                          activePreset === presetId ? "primary" : "default"
                        }
                        onClick={() => applyPreset(presetId)}
                        variant={
                          activePreset === presetId ? "filled" : "outlined"
                        }
                      />
                    ),
                  )}
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
                      backgroundColor: (theme) =>
                        alpha(theme.palette.common.white, 0.02),
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {panel.label}
                    </Typography>
                    <Switch
                      checked={panels[panel.id]}
                      onChange={() => togglePanel(panel.id)}
                      color="primary"
                    />
                  </Box>
                ))}
              </Box>
            </Stack>
          </ToolbarCard>
        )}

        <Grid>
          <LeftColumn>
            {panels.account && (
              <PanelCard elevation={0}>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Signed in as
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {conceptUser.email}
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                      justifyContent="flex-end"
                    >
                      <Chip
                        icon={<SensorsIcon />}
                        label={signalLabel}
                        color={signalColor}
                        variant="outlined"
                      />
                      <Chip
                        icon={<AutoAwesomeIcon />}
                        label={
                          hasLiveUser
                            ? "Live data bound"
                            : "Preview fallback active"
                        }
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </PanelCard>
            )}

            {panels.ticket && (
              <AccentPanel elevation={0}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="subtitle2" color="primary.light">
                      Ticket pool overview
                    </Typography>
                    <Typography variant="h2" fontWeight={700} sx={{ mt: 0.75 }}>
                      {isTicketLoading && hasLiveUser
                        ? "Syncing..."
                        : formatNumber(globalTicketCount)}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
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
            )}

            {panels.print && (
              <PanelCard elevation={0}>
                <Stack spacing={2.5}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        Print controls
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        The primary action stays obvious even when more panels
                        are enabled.
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
                          onClick={hasLiveUser ? printTicket : undefined}
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
            )}

            {panels.shop && (
              <PanelCard elevation={0}>
                <Stack spacing={2.5}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        Modular shop surfaces
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Shop groups become independent cards that can be docked
                        together or hidden when the user wants a cleaner
                        print-focused layout.
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
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(260px, 1fr))",
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
                            conceptUser.auto_buy_supplies_purchased
                              ? "Unlocked"
                              : `${formatNumber(autoBuyCost)} gold`
                          }
                          color={
                            conceptUser.auto_buy_supplies_purchased
                              ? "success"
                              : "default"
                          }
                          size="small"
                        />
                      </ShopRow>
                      <ShopRow>
                        <Typography variant="body2">
                          Credit generation
                        </Typography>
                        <Chip
                          label={`Lvl ${conceptUser.credit_generation_level} · ${formatNumber(creditGenerationCost)} gold`}
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
                          label={`${formatNumber(conceptUser.autoprinters)} active`}
                          color="primary"
                          size="small"
                        />
                      </ShopRow>
                      <ShopRow>
                        <Typography variant="body2">
                          Capacity upgrade
                        </Typography>
                        <Chip
                          label={`${formatNumber(creditCapacityCost)} tickets`}
                          color="default"
                          size="small"
                        />
                      </ShopRow>
                      <ShopRow>
                        <Typography variant="body2">
                          Spend confidence
                        </Typography>
                        <Chip
                          label={
                            canAfford(conceptUser, {
                              [ResourceType.CREDIT]: autoprinterCost,
                            })
                              ? "High"
                              : "Hold"
                          }
                          color={
                            canAfford(conceptUser, {
                              [ResourceType.CREDIT]: autoprinterCost,
                            })
                              ? "success"
                              : "warning"
                          }
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
                        <Typography variant="body2">
                          Recommended next buy
                        </Typography>
                        <Chip
                          label={suggestedFocus}
                          color="warning"
                          size="small"
                        />
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
            )}
          </LeftColumn>

          <RightColumn>
            {panels.status && (
              <PanelCard elevation={0}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <SensorsIcon color="primary" />
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Realtime health
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Compact enough to stay visible, detailed enough to
                        remain useful.
                      </Typography>
                    </Box>
                  </Stack>

                  <StatusList>
                    <StatusRow>
                      <Typography variant="body2">Connection</Typography>
                      <Chip
                        label={signalLabel}
                        color={signalColor}
                        size="small"
                      />
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
            )}

            {panels.insights && (
              <PanelCard elevation={0}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <InsightsIcon color="primary" />
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Secondary insights
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Optional panels can provide guidance without
                        overwhelming the default layout.
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
            )}

            <AccentPanel elevation={0}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Why this concept works
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  The interface feels more intentional because the main action,
                  supporting metrics, and optional panels each have distinct
                  visual weight. The user can simplify the surface without
                  losing the core workflow.
                </Typography>
              </Stack>
            </AccentPanel>
          </RightColumn>
        </Grid>
      </Shell>
    </PageRoot>
  );
}

export default DashboardConceptPage;
