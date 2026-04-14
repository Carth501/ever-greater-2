import InsightsIcon from "@mui/icons-material/Insights";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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