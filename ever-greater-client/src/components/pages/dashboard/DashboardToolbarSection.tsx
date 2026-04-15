import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useId } from "react";
import { panelLabels, presetIds } from "./config";
import { formatPresetLabel } from "./helpers";
import { ToolbarCard } from "./styles";
import type { PanelId, PanelState, PresetId } from "./types";

type DashboardToolbarSectionProps = {
  activePreset: PresetId;
  panels: PanelState;
  onPresetChange: (presetId: PresetId) => void;
  onTogglePanel: (panelId: PanelId) => void;
};

export function DashboardToolbarSection({
  activePreset,
  panels,
  onPresetChange,
  onTogglePanel,
}: DashboardToolbarSectionProps) {
  const headingId = useId();
  const descriptionId = useId();

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <ToolbarCard elevation={0}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box>
              <Typography id={headingId} variant="h6" fontWeight={700}>
                Panel visibility
              </Typography>
              <Typography
                id={descriptionId}
                variant="body2"
                color="text.secondary"
              >
                Compose the dashboard around the user’s preferred workflow
                without changing the underlying visual system.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {presetIds.map((presetId) => (
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
                  backgroundColor: (theme) =>
                    alpha(theme.palette.common.white, 0.02),
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
    </Box>
  );
}
