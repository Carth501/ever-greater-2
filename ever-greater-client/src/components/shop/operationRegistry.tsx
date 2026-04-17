import {
  OperationId,
  ResourceType,
  canAfford,
  getBuySuppliesGainForGold,
  getManualPrintQuantity,
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
import UpgradeGoldGroup, {
  type UpgradeGoldRowItem,
} from "./shop-groups/UpgradeGoldGroup";

type OperationHandlers = Pick<
  ReturnType<typeof useOperations>,
  | "buySupplies"
  | "buyGold"
  | "buyAutoprinter"
  | "buyAutoBuySupplies"
  | "toggleAutoBuySupplies"
  | "increaseCreditGeneration"
  | "increaseManualPrintBatch"
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

type GoldUpgradeDefinition = {
  key: string;
  operationIds: OperationId[];
  buildRow: (
    context: Pick<RegistryContext, "user" | "handlers">,
  ) => UpgradeGoldRowItem;
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

const goldUpgradeDefinitions: GoldUpgradeDefinition[] = [
  {
    key: "auto-buy-supplies",
    operationIds: [
      OperationId.AUTO_BUY_SUPPLIES,
      OperationId.TOGGLE_AUTO_BUY_SUPPLIES,
    ],
    buildRow: ({ user, handlers }) => {
      const autoBuyCost =
        getOperationCost(operations[OperationId.AUTO_BUY_SUPPLIES], { user })[
          ResourceType.GOLD
        ] ?? 0;
      const autoBuyPurchased = user.auto_buy_supplies_purchased;
      const autoBuyActive = user.auto_buy_supplies_active;

      return {
        key: "auto-buy-supplies",
        title: "Auto-Buy Supplies",
        meta: autoBuyPurchased ? "Unlocked" : `Cost: ${autoBuyCost}g`,
        description: autoBuyPurchased
          ? "Toggle automatic supplies purchasing on and off"
          : "One-time unlock. You keep access permanently.",
        action: autoBuyPurchased
          ? {
              kind: "toggle",
              checked: autoBuyActive,
              activeLabel: "Active",
              inactiveLabel: "Inactive",
              onChange: handlers.toggleAutoBuySupplies,
            }
          : {
              kind: "button",
              label: "Buy",
              disabled: !canAfford(user, {
                [ResourceType.GOLD]: autoBuyCost,
              }),
              onClick: handlers.buyAutoBuySupplies,
            },
      };
    },
  },
  {
    key: "increase-manual-print-batch",
    operationIds: [OperationId.INCREASE_MANUAL_PRINT_BATCH],
    buildRow: ({ user, handlers }) => {
      const manualPrintBatchCost =
        getOperationCost(operations[OperationId.INCREASE_MANUAL_PRINT_BATCH], {
          user,
        })[ResourceType.GOLD] ?? 0;
      const currentManualPrintQuantity = getManualPrintQuantity(user);
      const nextManualPrintQuantity = currentManualPrintQuantity * 2;

      return {
        key: "increase-manual-print-batch",
        title: "Increase Manual Print Batch",
        meta: `Cost: ${manualPrintBatchCost}g · Lvl ${user.manual_print_batch_level ?? 0}`,
        description: `Doubles each manual print from ${currentManualPrintQuantity} ticket${
          currentManualPrintQuantity === 1 ? "" : "s"
        } to ${nextManualPrintQuantity} ticket${
          nextManualPrintQuantity === 1 ? "" : "s"
        } per press.`,
        action: {
          kind: "button",
          label: "Buy",
          disabled: !canAfford(user, {
            [ResourceType.GOLD]: manualPrintBatchCost,
          }),
          onClick: handlers.increaseManualPrintBatch,
        },
      };
    },
  },
  {
    key: "increase-supplies-batch",
    operationIds: [OperationId.INCREASE_SUPPLIES_BATCH],
    buildRow: ({ user, handlers }) => {
      const suppliesBatchCost =
        getOperationCost(operations[OperationId.INCREASE_SUPPLIES_BATCH], {
          user,
        })[ResourceType.GOLD] ?? 0;
      const currentSuppliesBatchGold = getMaxSuppliesPurchaseGold(user);
      const currentSuppliesBatchAmount = getBuySuppliesGainForGold(
        currentSuppliesBatchGold,
      );
      const nextSuppliesBatchGold = currentSuppliesBatchGold * 2;
      const nextSuppliesBatchAmount = getBuySuppliesGainForGold(
        nextSuppliesBatchGold,
      );

      return {
        key: "increase-supplies-batch",
        title: "Increase Supplies Batch",
        meta: `Cost: ${suppliesBatchCost}g · Lvl ${user.supplies_batch_level ?? 0}`,
        description: `Doubles your max refill from ${currentSuppliesBatchAmount} supplies for ${currentSuppliesBatchGold}g to ${nextSuppliesBatchAmount} supplies for ${nextSuppliesBatchGold}g.`,
        action: {
          kind: "button",
          label: "Buy",
          disabled: !canAfford(user, {
            [ResourceType.GOLD]: suppliesBatchCost,
          }),
          onClick: handlers.increaseSuppliesBatch,
        },
      };
    },
  },
  {
    key: "increase-credit-generation",
    operationIds: [OperationId.INCREASE_CREDIT_GENERATION],
    buildRow: ({ user, handlers }) => {
      const creditGenerationCost =
        getOperationCost(operations[OperationId.INCREASE_CREDIT_GENERATION], {
          user,
        })[ResourceType.GOLD] ?? 0;

      return {
        key: "increase-credit-generation",
        title: "Increase Credit Generation",
        meta: `Cost: ${creditGenerationCost}g`,
        description: "Permanently increase credit generation by 0.1 per second",
        action: {
          kind: "button",
          label: "Buy",
          disabled: !canAfford(user, {
            [ResourceType.GOLD]: creditGenerationCost,
          }),
          onClick: handlers.increaseCreditGeneration,
        },
      };
    },
  },
];

const upgradeRegistry: RegistryEntry[] = [
  {
    key: "gold-upgrades",
    operationIds: goldUpgradeDefinitions.flatMap(
      (definition) => definition.operationIds,
    ),
    isVisible: () => true,
    render: ({ user, handlers }) => {
      return (
        <UpgradeGoldGroup
          gold={user.gold ?? 0}
          rows={goldUpgradeDefinitions.map((definition) =>
            definition.buildRow({ user, handlers }),
          )}
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
