import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import {
  OperationId,
  ResourceType,
  canAfford,
  getOperationCost,
  operations,
} from "ever-greater-shared";
import { JSX, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import { useOperations } from "../../hooks/useOperations";
import ShopCreditGroup from "./shop-groups/ShopCreditGroup";
import ShopGlobalTicketsGroup from "./shop-groups/ShopGlobalTicketsGroup";
import ShopGoldGroup from "./shop-groups/ShopGoldGroup";
import ShopMoneyGroup from "./shop-groups/ShopMoneyGroup";

type ShopProps = {
  onPurchaseError?: (error: string) => void;
};

type ShopGroupId = "money" | "gold" | "credit" | "globalTickets";

type ShopGroupVisibility = Record<ShopGroupId, boolean>;

const SHOP_GROUP_VISIBILITY_STORAGE_KEY = "ever-greater.shop.visible-groups";

const defaultShopGroupVisibility: ShopGroupVisibility = {
  money: true,
  gold: true,
  credit: true,
  globalTickets: true,
};

const ShopGroups = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  alignItems: "stretch",
}));

const ShopCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.25),
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
  boxShadow: `0 14px 30px ${alpha(theme.palette.common.black, 0.2)}`,
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const ShopVisibilityToolbar = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  padding: theme.spacing(1.25),
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
  backgroundColor: alpha(theme.palette.common.white, 0.03),
}));

const EmptyState = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 20,
  border: `1px dashed ${alpha(theme.palette.primary.main, 0.28)}`,
  backgroundColor: alpha(theme.palette.common.white, 0.02),
}));

function loadShopGroupVisibility(): ShopGroupVisibility {
  if (typeof window === "undefined") {
    return defaultShopGroupVisibility;
  }

  const rawValue = window.localStorage.getItem(
    SHOP_GROUP_VISIBILITY_STORAGE_KEY,
  );

  if (!rawValue) {
    return defaultShopGroupVisibility;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<ShopGroupVisibility>;

    return {
      ...defaultShopGroupVisibility,
      ...parsedValue,
    };
  } catch {
    return defaultShopGroupVisibility;
  }
}

function Shop({ onPurchaseError }: ShopProps): JSX.Element {
  const { user: currentUser } = useAuth();
  const { count: globalTicketCount } = useGame();
  const {
    buySupplies,
    buyGold,
    buyAutoprinter,
    buyAutoBuySupplies,
    toggleAutoBuySupplies,
    increaseCreditGeneration,
    increaseCreditCapacity,
  } = useOperations(onPurchaseError);
  const [visibleGroups, setVisibleGroups] = useState<ShopGroupVisibility>(
    loadShopGroupVisibility,
  );

  if (!currentUser) {
    return <Typography>Loading...</Typography>;
  }

  const availableGroups = useMemo(
    () => [
      ...(currentUser.tickets_contributed > 200
        ? ([{ id: "money", label: "Money & Gold" }] as const)
        : []),
      { id: "gold", label: "Gold & Supplies" } as const,
      ...(currentUser.tickets_contributed > 500
        ? ([{ id: "credit", label: "Credit Systems" }] as const)
        : []),
      { id: "globalTickets", label: "Global Tickets" } as const,
    ],
    [currentUser.tickets_contributed],
  );

  useEffect(() => {
    setVisibleGroups((currentVisibility) => {
      const nextVisibility = { ...currentVisibility };
      let hasChanged = false;

      for (const group of availableGroups) {
        if (typeof nextVisibility[group.id] === "undefined") {
          nextVisibility[group.id] = true;
          hasChanged = true;
        }
      }

      return hasChanged ? nextVisibility : currentVisibility;
    });
  }, [availableGroups]);

  useEffect(() => {
    window.localStorage.setItem(
      SHOP_GROUP_VISIBILITY_STORAGE_KEY,
      JSON.stringify(visibleGroups),
    );
  }, [visibleGroups]);

  function toggleGroup(groupId: ShopGroupId) {
    setVisibleGroups((currentVisibility) => ({
      ...currentVisibility,
      [groupId]: !currentVisibility[groupId],
    }));
  }

  const money = currentUser.money ?? 0;
  const gold = currentUser.gold ?? 0;
  const autoprinters = currentUser.autoprinters ?? 0;
  const operationContext = { user: currentUser };

  const buySuppliesOperation = operations[OperationId.BUY_SUPPLIES];
  const buyGoldOperation = operations[OperationId.BUY_GOLD];
  const autoBuySuppliesOperation = operations[OperationId.AUTO_BUY_SUPPLIES];
  const buyAutoprinterOperation = operations[OperationId.BUY_AUTOPRINTER];
  const increaseCreditGenerationOperation =
    operations[OperationId.INCREASE_CREDIT_GENERATION];
  const increaseCreditCapacityOperation =
    operations[OperationId.INCREASE_CREDIT_CAPACITY];

  const suppliesCost = getOperationCost(buySuppliesOperation, operationContext);
  const suppliesCostInGold = suppliesCost[ResourceType.GOLD] ?? 0;
  const canAffordSupplies = canAfford(currentUser, suppliesCost);
  const isButtonDisabled = !canAffordSupplies;

  // Gold purchase calculations
  const goldCostPerUnit =
    getOperationCost(buyGoldOperation, {
      user: currentUser,
      params: { quantity: 1 },
    })[ResourceType.MONEY] ?? 0;
  const canAffordGold1 = canAfford(currentUser, {
    [ResourceType.MONEY]:
      getOperationCost(buyGoldOperation, {
        user: currentUser,
        params: { quantity: 1 },
      })[ResourceType.MONEY] ?? 0,
  });
  const canAffordGold10 = canAfford(currentUser, {
    [ResourceType.MONEY]:
      getOperationCost(buyGoldOperation, {
        user: currentUser,
        params: { quantity: 10 },
      })[ResourceType.MONEY] ?? 0,
  });
  const canAffordGold100 = canAfford(currentUser, {
    [ResourceType.MONEY]:
      getOperationCost(buyGoldOperation, {
        user: currentUser,
        params: { quantity: 100 },
      })[ResourceType.MONEY] ?? 0,
  });

  // Autoprinter calculations
  const autoprinterCost =
    getOperationCost(buyAutoprinterOperation, operationContext)[
      ResourceType.CREDIT
    ] ?? 0;
  const canAffordAutoprinter = canAfford(currentUser, {
    [ResourceType.CREDIT]: autoprinterCost,
  });

  // Credit generation upgrade calculations
  const creditGenerationCost =
    getOperationCost(increaseCreditGenerationOperation, operationContext)[
      ResourceType.GOLD
    ] ?? 0;
  const canAffordCreditGeneration = canAfford(currentUser, {
    [ResourceType.GOLD]: creditGenerationCost,
  });

  const autoBuySuppliesCost =
    getOperationCost(autoBuySuppliesOperation, operationContext)[
      ResourceType.GOLD
    ] ?? 0;
  const canAffordAutoBuySupplies = canAfford(currentUser, {
    [ResourceType.GOLD]: autoBuySuppliesCost,
  });

  // Calculate remaining draw capacity
  const ticketsContributed = currentUser.tickets_contributed ?? 0;
  const ticketsWithdrawn = currentUser.tickets_withdrawn ?? 0;
  const remainingCapacity = Math.max(0, ticketsContributed - ticketsWithdrawn);

  // Credit capacity upgrade calculations
  const creditCapacityCost =
    getOperationCost(increaseCreditCapacityOperation, operationContext)[
      ResourceType.GLOBAL_TICKETS
    ] ?? 0;
  const canAffordCreditCapacity =
    canAfford(currentUser, {
      [ResourceType.GLOBAL_TICKETS]: creditCapacityCost,
    }) && remainingCapacity >= creditCapacityCost;

  const visibleAvailableGroups = availableGroups.filter(
    (group) => visibleGroups[group.id] !== false,
  );

  return (
    <ShopCard elevation={0}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="overline" color="primary.light">
            Upgrades and automation
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            Shop
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Upgrade resources and automation systems as new groups unlock.
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Visible shop groups
          </Typography>
          <ShopVisibilityToolbar>
            {availableGroups.map((group) => {
              const isVisible = visibleGroups[group.id] !== false;

              return (
                <Chip
                  key={group.id}
                  clickable
                  label={`${isVisible ? "Hide" : "Show"} ${group.label}`}
                  color={isVisible ? "primary" : "default"}
                  onClick={() => toggleGroup(group.id)}
                  variant={isVisible ? "filled" : "outlined"}
                />
              );
            })}
          </ShopVisibilityToolbar>
        </Box>

        <ShopGroups>
          {visibleGroups.money !== false &&
            currentUser.tickets_contributed > 200 && (
              <ShopMoneyGroup
                money={money}
                goldCostPerUnit={goldCostPerUnit}
                canAffordGold1={canAffordGold1}
                canAffordGold10={canAffordGold10}
                canAffordGold100={canAffordGold100}
                onBuyGold={buyGold}
              />
            )}

          {visibleGroups.gold !== false && (
            <ShopGoldGroup
              gold={gold}
              suppliesCostInGold={suppliesCostInGold}
              isSuppliesButtonDisabled={isButtonDisabled}
              autoBuyCost={autoBuySuppliesCost}
              autoBuyPurchased={currentUser.auto_buy_supplies_purchased}
              autoBuyActive={currentUser.auto_buy_supplies_active}
              canAffordAutoBuyUnlock={canAffordAutoBuySupplies}
              creditGenerationCost={creditGenerationCost}
              canAffordCreditGeneration={canAffordCreditGeneration}
              onBuySupplies={buySupplies}
              onBuyAutoBuySupplies={buyAutoBuySupplies}
              onToggleAutoBuySupplies={toggleAutoBuySupplies}
              onIncreaseCreditGeneration={increaseCreditGeneration}
            />
          )}

          {visibleGroups.credit !== false &&
            currentUser.tickets_contributed > 500 && (
              <ShopCreditGroup
                user={currentUser}
                autoprinters={autoprinters}
                autoprinterCost={autoprinterCost}
                canAffordAutoprinter={canAffordAutoprinter}
                onBuyAutoprinter={buyAutoprinter}
              />
            )}

          {visibleGroups.globalTickets !== false && (
            <ShopGlobalTicketsGroup
              globalTicketCount={globalTicketCount}
              remainingCapacity={remainingCapacity}
              creditCapacityCost={creditCapacityCost}
              canAffordCreditCapacity={canAffordCreditCapacity}
              onIncreaseCreditCapacity={increaseCreditCapacity}
            />
          )}
        </ShopGroups>

        {visibleAvailableGroups.length === 0 && (
          <EmptyState>
            <Typography variant="subtitle1" fontWeight={700}>
              All available shop groups are hidden
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75 }}
            >
              Use the visibility controls above to bring back the upgrade groups
              you want in view.
            </Typography>
          </EmptyState>
        )}
      </Stack>
    </ShopCard>
  );
}

export default Shop;
