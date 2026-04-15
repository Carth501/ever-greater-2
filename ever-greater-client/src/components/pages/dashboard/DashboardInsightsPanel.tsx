import InsightsIcon from "@mui/icons-material/Insights";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";
import { dashboardContent } from "./content";
import { formatSignedValue } from "./helpers";
import { InsightGrid, MetricCard, PanelCard } from "./styles";

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
  const headingId = useId();
  const descriptionId = useId();

  return (
    <Box
      component="section"
      aria-label={dashboardContent.insights.regionLabel}
      aria-describedby={descriptionId}
    >
      <PanelCard elevation={0}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <InsightsIcon color="primary" />
            <Box>
              <Typography id={headingId} variant="h6" fontWeight={700}>
                {dashboardContent.insights.heading}
              </Typography>
              <Typography
                id={descriptionId}
                variant="body2"
                color="text.secondary"
              >
                {dashboardContent.insights.description}
              </Typography>
            </Box>
          </Stack>

          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
            <InsightGrid>
              <Box component="li" sx={{ listStyle: "none" }}>
                <MetricCard>
                  <Typography variant="subtitle2" color="text.secondary">
                    Best earning window
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {bestWindow}
                  </Typography>
                </MetricCard>
              </Box>
              <Box component="li" sx={{ listStyle: "none" }}>
                <MetricCard>
                  <Typography variant="subtitle2" color="text.secondary">
                    Automation mix
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {formatSignedValue(automationMix).replace("+", "")}
                  </Typography>
                </MetricCard>
              </Box>
              <Box component="li" sx={{ listStyle: "none" }}>
                <MetricCard>
                  <Typography variant="subtitle2" color="text.secondary">
                    Suggested focus
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {suggestedFocus}
                  </Typography>
                </MetricCard>
              </Box>
              <Box component="li" sx={{ listStyle: "none" }}>
                <MetricCard>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pool trend
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {poolTrend}
                  </Typography>
                </MetricCard>
              </Box>
            </InsightGrid>
          </Box>
        </Stack>
      </PanelCard>
    </Box>
  );
}
