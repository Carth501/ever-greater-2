import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { JSX } from "react";
import type { User } from "../../api/auth";

type AuthHeaderProps = {
  user: User;
  onLogout: () => void;
};

const HeaderCard = styled(Paper)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2),
}));

function AuthHeader({ user, onLogout }: AuthHeaderProps): JSX.Element {
  return (
    <HeaderCard elevation={3}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Signed in as
        </Typography>
        <Typography variant="body1" fontWeight={600}>
          {user.email}
        </Typography>
      </Box>
      <Button variant="outlined" color="inherit" onClick={onLogout}>
        Logout
      </Button>
    </HeaderCard>
  );
}

export default AuthHeader;
