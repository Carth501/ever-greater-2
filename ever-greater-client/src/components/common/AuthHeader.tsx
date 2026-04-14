import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import { JSX } from "react";
import type { User } from "../../api/auth";

type AuthHeaderProps = {
  user: User;
  onLogout: () => void;
};

const HeaderCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 22,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  background:
    `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(theme.palette.common.white, 0.02)} 100%)`,
  boxShadow: `0 14px 30px ${alpha(theme.palette.common.black, 0.2)}`,
}));

function AuthHeader({ user, onLogout }: AuthHeaderProps): JSX.Element {
  return (
    <HeaderCard elevation={0}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        <Stack spacing={1.25}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Signed in as
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {user.email}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label="Active session" color="success" variant="outlined" />
            <Chip label="Modular layout" color="primary" variant="outlined" />
          </Stack>
        </Stack>

        <Button variant="outlined" color="inherit" onClick={onLogout}>
          Logout
        </Button>
      </Stack>
    </HeaderCard>
  );
}

export default AuthHeader;
