import {
  OperationId,
  ResourceType,
  canAfford,
  getBuySuppliesGainForGold,
  getMaxSuppliesPurchaseGold,
  getOperationCost,
  getOperationGain,
  operations,
  type User,
} from "ever-greater-shared";
import type { JSX } from "react";
import type { useOperations } from "../../hooks/useOperations";
import ShopCreditGroup from "./shop-groups/ShopCreditGroup";
import ShopGlobalTicketsGroup from "./shop-groups/ShopGlobalTicketsGroup";
import ShopMoneyGroup from "./shop-groups/ShopMoneyGroup";
import ShopSuppliesGroup from "./shop-groups/ShopSuppliesGroup";
import UpgradeGoldGroup from "./shop-groups/UpgradeGoldGroup";

type OperationHandlers = Pick<
  ReturnType<typeof useOperations>,
  | "buySupplies"
  | "buyGold"
  | "buyAutoprinter"
  | "buyAutoBuySupplies"
  | "toggleAutoBuySupplies"
  | "increaseCreditGeneration"
  | "increaseSuppliesBatch"
  | "increaseCreditCapacity"
>;

type RegistryContext = {
  user: User;
  globalTicketCount: number;
  handlers: OperationHandlers;
};

type RenderedGroup = {
  key: string;
  element: JSX.Element;
};

type RegistryEntry = {
  key: string;
  operationIds: OperationId[];
  isVisible: (context: RegistryContext) => boolean;
  render: (context: RegistryContext) => JSX.Element;
};

const shopRegistry: RegistryEntry[] = [
  {
    key: "buy-gold",
    operationIds: [OperationId.BUY_GOLD],
    isVisible: ({ user }) => user.tickets_contributed > 200,
    render: ({ user, handlers }) => {
      const money = user.money ?? 0;
      const buyGoldOperation = operations[OperationId.BUY_GOLD];
      const goldCostPerUnit =
        getOperationCost(buyGoldOperation, {
          user,
          params: { quantity: 1 },
        })[ResourceType.MONEY] ?? 0;

      return (
        <ShopMoneyGroup
          money={money}
          goldCostPerUnit={goldCostPerUnit}
          canAffordGold1={canAfford(user, {
            [ResourceType.MONEY]:
              getOperationCost(buyGoldOperation, {
                user,
                params: { quantity: 1 },
              })[ResourceType.MONEY] ?? 0,
          })}
          canAffordGold10={canAfford(user, {
            [ResourceType.MONEY]:
              getOperationCost(buyGoldOperation, {
                user,
                params: { quantity: 10 },
              })[ResourceType.MONEY] ?? 0,
          })}
          canAffordGold100={canAfford(user, {
            [ResourceType.MONEY]:
              getOperationCost(buyGoldOperation, {
                user,
                params: { quantity: 100 },
              })[ResourceType.MONEY] ?? 0,
          })}
          onBuyGold={handlers.buyGold}
        />
      );
    },
  },
  {
    key: "buy-supplies",
    operationIds: [OperationId.BUY_SUPPLIES],
    isVisible: () => true,
    render: ({ user, handlers }) => {
      const suppliesOperation = operations[OperationId.BUY_SUPPLIES];
      const operationContext = { user };
      const suppliesCost = getOperationCost(
        suppliesOperation,
        operationContext,
      );
      const suppliesGain = getOperationGain(
        suppliesOperation,
        operationContext,
      );
      const maxSuppliesCostInGold = getMaxSuppliesPurchaseGold(user);

      return (
        <ShopSuppliesGroup
          gold={user.gold ?? 0}
          maxSuppliesAmount={getBuySuppliesGainForGold(maxSuppliesCostInGold)}
          maxSuppliesCostInGold={maxSuppliesCostInGold}
          suppliesAmount={suppliesGain[ResourceType.PRINTER_SUPPLIES] ?? 0}
          suppliesCostInGold={suppliesCost[ResourceType.GOLD] ?? 0}
          canAffordSupplies={(user.gold ?? 0) > 0}
          onBuySupplies={handlers.buySupplies}
        />
      );
    },
  },
];

const upgradeRegistry: RegistryEntry[] = [
  {
    key: "gold-upgrades",
    operationIds: [
      OperationId.AUTO_BUY_SUPPLIES,
      OperationId.TOGGLE_AUTO_BUY_SUPPLIES,
      OperationId.INCREASE_SUPPLIES_BATCH,
      OperationId.INCREASE_CREDIT_GENERATION,
    ],
    isVisible: () => true,
    render: ({ user, handlers }) => {
      const operationContext = { user };
      const autoBuySuppliesCost =
        getOperationCost(
          operations[OperationId.AUTO_BUY_SUPPLIES],
          operationContext,
        )[ResourceType.GOLD] ?? 0;
      const suppliesBatchCost =
        getOperationCost(
          operations[OperationId.INCREASE_SUPPLIES_BATCH],
          operationContext,
        )[ResourceType.GOLD] ?? 0;
      const creditGenerationCost =
        getOperationCost(
          operations[OperationId.INCREASE_CREDIT_GENERATION],
          operationContext,
        )[ResourceType.GOLD] ?? 0;
      const currentSuppliesBatchGold = getMaxSuppliesPurchaseGold(user);

      return (
        <UpgradeGoldGroup
          gold={user.gold ?? 0}
          autoBuyCost={autoBuySuppliesCost}
          autoBuyPurchased={user.auto_buy_supplies_purchased}
          autoBuyActive={user.auto_buy_supplies_active}
          canAffordAutoBuyUnlock={canAfford(user, {
            [ResourceType.GOLD]: autoBuySuppliesCost,
          })}
          creditGenerationCost={creditGenerationCost}
          canAffordCreditGeneration={canAfford(user, {
            [ResourceType.GOLD]: creditGenerationCost,
          })}
          suppliesBatchCost={suppliesBatchCost}
          suppliesBatchLevel={user.supplies_batch_level ?? 0}
          currentSuppliesBatchAmount={getBuySuppliesGainForGold(
            currentSuppliesBatchGold,
          )}
          currentSuppliesBatchGold={currentSuppliesBatchGold}
          nextSuppliesBatchAmount={getBuySuppliesGainForGold(
            currentSuppliesBatchGold * 2,
          )}
          nextSuppliesBatchGold={currentSuppliesBatchGold * 2}
          canAffordSuppliesBatch={canAfford(user, {
            [ResourceType.GOLD]: suppliesBatchCost,
          })}
          onBuyAutoBuySupplies={handlers.buyAutoBuySupplies}
          onToggleAutoBuySupplies={handlers.toggleAutoBuySupplies}
          onIncreaseCreditGeneration={handlers.increaseCreditGeneration}
          onIncreaseSuppliesBatch={handlers.increaseSuppliesBatch}
        />
      );
    },
  },
  {
    key: "buy-autoprinter",
    operationIds: [OperationId.BUY_AUTOPRINTER],
    isVisible: ({ user }) => user.tickets_contributed > 500,
    render: ({ user, handlers }) => {
      const autoprinterCost =
        getOperationCost(operations[OperationId.BUY_AUTOPRINTER], { user })[
          ResourceType.CREDIT
        ] ?? 0;

      return (
        <ShopCreditGroup
          user={user}
          autoprinters={user.autoprinters ?? 0}
          autoprinterCost={autoprinterCost}
          canAffordAutoprinter={canAfford(user, {
            [ResourceType.CREDIT]: autoprinterCost,
          })}
          onBuyAutoprinter={handlers.buyAutoprinter}
        />
      );
    },
  },
  {
    key: "increase-credit-capacity",
    operationIds: [OperationId.INCREASE_CREDIT_CAPACITY],
    isVisible: () => true,
    render: ({ user, globalTicketCount, handlers }) => {
      const ticketsContributed = user.tickets_contributed ?? 0;
      const ticketsWithdrawn = user.tickets_withdrawn ?? 0;
      const remainingCapacity = Math.max(
        0,
        ticketsContributed - ticketsWithdrawn,
      );
      const creditCapacityCost =
        getOperationCost(operations[OperationId.INCREASE_CREDIT_CAPACITY], {
          user,
        })[ResourceType.GLOBAL_TICKETS] ?? 0;

      return (
        <ShopGlobalTicketsGroup
          globalTicketCount={globalTicketCount}
          remainingCapacity={remainingCapacity}
          creditCapacityCost={creditCapacityCost}
          canAffordCreditCapacity={remainingCapacity >= creditCapacityCost}
          onIncreaseCreditCapacity={handlers.increaseCreditCapacity}
        />
      );
    },
  },
];

function renderRegistry(
  registry: RegistryEntry[],
  context: RegistryContext,
): RenderedGroup[] {
  return registry
    .filter((entry) => entry.isVisible(context))
    .map((entry) => ({
      key: entry.key,
      element: entry.render(context),
    }));
}

export function getShopOperationGroups(
  context: Omit<RegistryContext, "globalTicketCount">,
): RenderedGroup[] {
  return renderRegistry(shopRegistry, {
    ...context,
    globalTicketCount: 0,
  });
}

export function getUpgradeOperationGroups(
  context: RegistryContext,
): RenderedGroup[] {
  return renderRegistry(upgradeRegistry, context);
}
