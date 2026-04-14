import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { alpha, styled } from "@mui/material/styles";

export const PageRoot = styled(Box)(({ theme }) => ({
  minHeight: "calc(100vh - 56px)",
  padding: theme.spacing(4, 0, 6),
  background:
    `radial-gradient(circle at top left, ${alpha(theme.palette.primary.main, 0.18)} 0%, transparent 35%), ` +
    `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
}));

export const Shell = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
  width: "min(1280px, 100%)",
  margin: "0 auto",
  padding: theme.spacing(0, 3),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0, 2),
  },
}));

export const HeroCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3.5),
  borderRadius: 24,
  border: `1px solid ${alpha(theme.palette.primary.light, 0.26)}`,
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 46%, ${alpha(theme.palette.secondary.dark, 0.94)} 100%)`,
  boxShadow: `0 18px 48px ${alpha(theme.palette.common.black, 0.28)}`,
  overflow: "hidden",
}));

export const HeroGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 0.85fr)",
  gap: theme.spacing(3),
  alignItems: "stretch",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const ToolbarCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.88),
  backdropFilter: "blur(14px)",
}));

export const Grid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.6fr) minmax(300px, 0.95fr)",
  gap: theme.spacing(3),
  alignItems: "start",
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const LeftColumn = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

export const RightColumn = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

export const FeatureStrip = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const PanelCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 22,
  backgroundColor: alpha(theme.palette.background.paper, 0.92),
  border: `1px solid ${alpha(theme.palette.common.white, 0.07)}`,
  boxShadow: `0 14px 30px ${alpha(theme.palette.common.black, 0.22)}`,
}));

export const AccentPanel = styled(PanelCard)(({ theme }) => ({
  background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.34)}`,
}));

export const MetricsRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const MetricCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 18,
  backgroundColor: alpha(theme.palette.common.white, 0.03),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
}));

export const PrintZone = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(220px, 0.8fr)",
  gap: theme.spacing(2),
  alignItems: "stretch",
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const StatusList = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1.5),
}));

export const StatusRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: 16,
  backgroundColor: alpha(theme.palette.common.white, 0.03),
  border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
}));

export const InsightGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const Pill = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(0.75, 1.25),
  borderRadius: 999,
  border: `1px solid ${alpha(theme.palette.primary.light, 0.24)}`,
  color: theme.palette.primary.light,
  backgroundColor: alpha(theme.palette.primary.main, 0.12),
}));
