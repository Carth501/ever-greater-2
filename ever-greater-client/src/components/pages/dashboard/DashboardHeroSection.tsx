import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import LayersIcon from "@mui/icons-material/Layers";
import PaletteIcon from "@mui/icons-material/Palette";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";
import { presetIds } from "./config";
import { formatPresetLabel } from "./helpers";
import {
  AccentPanel,
  FeatureStrip,
  HeroCard,
  HeroGrid,
  MetricCard,
  MetricsRow,
  Pill,
} from "./styles";
import type { PresetId } from "./types";

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
  const headingId = useId();
  const descriptionId = useId();

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <HeroCard elevation={0}>
        <HeroGrid>
          <Stack spacing={2.5}>
            <Pill>
              <PaletteIcon fontSize="small" />
              <Typography variant="subtitle2">
                Dashboard preview: modular operator system
              </Typography>
            </Pill>
            <Typography id={headingId} variant="h2" sx={{ maxWidth: 760 }}>
              A cleaner command center for printing, monitoring, and upgrading
              without locking the user into one rigid layout.
            </Typography>
            <Typography
              id={descriptionId}
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 720 }}
            >
              This dashboard keeps the current dark MUI foundation, preserves
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
                    surfaces that can expand, collapse, or be docked separately.
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
              <div>
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
                  Designed for the user who wants ticket metrics, printing, shop
                  decisions, and system health visible in one frame.
                </Typography>
              </div>

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
                {presetIds.map((presetId) => (
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
    </Box>
  );
}
