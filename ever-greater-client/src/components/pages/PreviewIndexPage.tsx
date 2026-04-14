import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import { type JSX } from "react";

const PageRoot = styled(Box)(({ theme }) => ({
  minHeight: "calc(100vh - 56px)",
  padding: theme.spacing(4, 0, 6),
  background:
    `radial-gradient(circle at top left, ${alpha(theme.palette.primary.main, 0.16)} 0%, transparent 32%), ` +
    `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.secondary.main, 0.84)} 100%)`,
}));

const Shell = styled(Stack)(({ theme }) => ({
  width: "min(1180px, 100%)",
  margin: "0 auto",
  padding: theme.spacing(0, 3),
  gap: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0, 2),
  },
}));

const HeroCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3.5),
  borderRadius: 24,
  border: `1px solid ${alpha(theme.palette.primary.light, 0.24)}`,
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 48%, ${alpha(theme.palette.secondary.dark, 0.92)} 100%)`,
  boxShadow: `0 18px 48px ${alpha(theme.palette.common.black, 0.26)}`,
}));

const ConceptsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: theme.spacing(3),
}));

const ConceptCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 22,
  backgroundColor: alpha(theme.palette.background.paper, 0.92),
  border: `1px solid ${alpha(theme.palette.common.white, 0.07)}`,
  boxShadow: `0 14px 32px ${alpha(theme.palette.common.black, 0.22)}`,
}));

const AccentPill = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(0.75, 1.25),
  borderRadius: 999,
  color: theme.palette.primary.light,
  border: `1px solid ${alpha(theme.palette.primary.light, 0.24)}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.12),
}));

function PreviewIndexPage(): JSX.Element {
  return (
    <PageRoot>
      <Shell>
        <HeroCard elevation={0}>
          <Stack spacing={2.5}>
            <AccentPill>
              <DashboardCustomizeIcon fontSize="small" />
              <Typography variant="subtitle2">Internal preview mode</Typography>
            </AccentPill>

            <Typography variant="h2" sx={{ maxWidth: 760 }}>
              A stable internal entry point for design concepts, layout
              experiments, and future preview-only surfaces.
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 760 }}
            >
              Use this index as the durable home for concept pages. It keeps
              preview work discoverable without mixing it into the main
              authenticated flow.
            </Typography>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                label="#internal/preview"
                color="primary"
                variant="outlined"
              />
              <Chip label="Hash-based" variant="outlined" />
              <Chip label="Safe for local preview" variant="outlined" />
            </Stack>
          </Stack>
        </HeroCard>

        <ConceptsGrid>
          <ConceptCard elevation={0}>
            <Stack spacing={2.5}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    Modular dashboard concept
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    The current concept page for the authenticated experience.
                    It uses live state when available and falls back to preview
                    data when the backend is unavailable.
                  </Typography>
                </Box>
                <DashboardCustomizeIcon color="primary" />
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label="React + MUI" color="primary" size="small" />
                <Chip label="Live-bound" size="small" />
                <Chip label="Toggleable panels" size="small" />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  href="#internal/preview/dashboard"
                  endIcon={<ArrowOutwardIcon />}
                >
                  Open dashboard preview
                </Button>
                <Button
                  variant="outlined"
                  href="#internal/preview/dashboard?controls=0"
                  startIcon={<VisibilityOffIcon />}
                >
                  Open clean capture mode
                </Button>
              </Stack>
            </Stack>
          </ConceptCard>
        </ConceptsGrid>
      </Shell>
    </PageRoot>
  );
}

export default PreviewIndexPage;
