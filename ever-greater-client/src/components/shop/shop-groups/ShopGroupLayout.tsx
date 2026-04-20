import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import { alpha, styled } from "@mui/material/styles";

export const ShopRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
  backgroundColor: alpha(theme.palette.common.white, 0.03),
  flexWrap: "wrap",
}));

export const ShopGroup = styled(Paper)(({ theme }) => ({
  flex: "1 1 320px",
  minWidth: 0,
  padding: theme.spacing(2.25),
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.common.white, 0.07)}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.88),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));
