import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type UpgradeGoldAction =
  | {
      kind: "button";
      label: string;
      disabled: boolean;
      onClick: () => void;
    }
  | {
      kind: "toggle";
      checked: boolean;
      activeLabel: string;
      inactiveLabel: string;
      onChange: (active: boolean) => void;
    };

export type UpgradeGoldRowItem = {
  key: string;
  title: string;
  meta: string;
  description: string;
  action: UpgradeGoldAction;
};

type UpgradeGoldGroupProps = {
  gold: number;
  rows: UpgradeGoldRowItem[];
};

function UpgradeGoldGroup({ gold, rows }: UpgradeGoldGroupProps): JSX.Element {
  return (
    <ShopGroup>
      <Typography variant="body2" color="text.secondary">
        Gold Available: <strong>{gold}g</strong>
      </Typography>

      {rows.map((row) => (
        <ShopRow key={row.key}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {row.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {row.meta}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {row.description}
            </Typography>
          </Box>
          {row.action.kind === "toggle" ? (
            (() => {
              const action = row.action;

              return (
                <FormControlLabel
                  control={
                    <Switch
                      checked={action.checked}
                      onChange={(event) =>
                        action.onChange(event.target.checked)
                      }
                    />
                  }
                  label={
                    action.checked ? action.activeLabel : action.inactiveLabel
                  }
                />
              );
            })()
          ) : (
            <Button
              onClick={row.action.onClick}
              variant="contained"
              disabled={row.action.disabled}
            >
              {row.action.label}
            </Button>
          )}
        </ShopRow>
      ))}
    </ShopGroup>
  );
}

export default UpgradeGoldGroup;
