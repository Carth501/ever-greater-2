import {
  AutoBuyResourceKey,
  CREDIT_CAPACITY_UPGRADE_AMOUNT,
  getAutoBuyRule,
  getAutoprinterPrintQuantity,
  getMaxSuppliesPurchaseGold,
  OperationId,
  resolveAutoBuySpendAmount,
  ResourceType,
  shouldTriggerAutoBuy,
  type User,
} from "ever-greater-shared";
import {
  executeOperationForUser,
  getAutoBuySuppliesTargetSpend,
  maybeAutoBuyGoldForUser,
  OperationValidationError,
} from "../operations/execution.js";
import {
  coerceUserRowNumbersInPlace,
  USER_SELECT_COLUMNS,
  withPoolClient,
  withTransaction,
} from "./core.js";

async function selectScheduledUsers(
  whereClause: string,
  client: Parameters<typeof withPoolClient>[0] extends (
    arg: infer T,
  ) => Promise<unknown>
    ? T
    : never,
): Promise<User[]> {
  const result = await client.query(
    `SELECT ${USER_SELECT_COLUMNS}, 0 AS tickets_withdrawn FROM users WHERE ${whereClause}`,
  );

  return result.rows.map((row) => {
    const userRow = row as User;
    coerceUserRowNumbersInPlace(userRow);
    userRow.tickets_withdrawn = Number(userRow.tickets_withdrawn ?? 0);
    return userRow;
  });
}

export async function processAutoprinters(): Promise<{
  totalTickets: number;
  newGlobalCount: number | null;
}> {
  return withTransaction(async (client) => {
    const users = await selectScheduledUsers("autoprinters > 0", client);

    let totalTickets = 0;
    let newGlobalCount: number | null = null;

    for (const user of users) {
      let currentUser = await maybeAutoBuyGoldForUser(
        user.id,
        user,
        0,
        0,
        client,
      );
      const desiredPrintQuantity = getAutoprinterPrintQuantity(currentUser);
      const autoBuyRule = getAutoBuyRule(
        currentUser.auto_buy_settings,
        AutoBuyResourceKey.PRINTER_SUPPLIES,
      );

      const needsAutoBuyRefill =
        currentUser.auto_buy_supplies_active &&
        currentUser.auto_buy_supplies_purchased &&
        shouldTriggerAutoBuy(
          currentUser.printer_supplies ?? 0,
          desiredPrintQuantity,
          autoBuyRule.threshold,
        );

      if (needsAutoBuyRefill) {
        let spendGold = resolveAutoBuySpendAmount(
          autoBuyRule,
          currentUser.gold ?? 0,
          Math.min(
            currentUser.gold ?? 0,
            getMaxSuppliesPurchaseGold(currentUser),
          ),
        );

        if (spendGold < 1) {
          currentUser = await maybeAutoBuyGoldForUser(
            currentUser.id,
            currentUser,
            0,
            getAutoBuySuppliesTargetSpend(currentUser),
            client,
          );
          spendGold = resolveAutoBuySpendAmount(
            autoBuyRule,
            currentUser.gold ?? 0,
            Math.min(
              currentUser.gold ?? 0,
              getMaxSuppliesPurchaseGold(currentUser),
            ),
          );
        }

        if (spendGold >= 1) {
          try {
            const refillResult = await executeOperationForUser(
              currentUser.id,
              OperationId.BUY_SUPPLIES,
              { spendGold },
              {
                client,
                currentUser,
                globalTicketCount: 0,
                allowPrintAutoBuyFallback: false,
              },
            );
            currentUser = refillResult.user;
          } catch (error) {
            if (!(error instanceof OperationValidationError)) {
              throw error;
            }
          }
        }
      }

      const printQuantity = Math.min(
        getAutoprinterPrintQuantity(currentUser),
        currentUser.printer_supplies ?? 0,
      );

      if (printQuantity < 1) {
        continue;
      }

      const printResult = await executeOperationForUser(
        currentUser.id,
        OperationId.PRINT_TICKET,
        { quantity: printQuantity },
        {
          client,
          currentUser,
          globalTicketCount: 0,
          allowPrintAutoBuyFallback: false,
        },
      );

      totalTickets += printResult.gain[ResourceType.TICKETS_CONTRIBUTED] ?? 0;
      newGlobalCount = printResult.count;
    }

    return { totalTickets, newGlobalCount };
  });
}

export async function updateAllUsersCreditValues(): Promise<number> {
  return withPoolClient(async (client) => {
    const users = await selectScheduledUsers(
      `credit_generation_level > 0 AND credit_value < (credit_capacity_level * (${CREDIT_CAPACITY_UPGRADE_AMOUNT} + credit_capacity_amount_level))`,
      client,
    );

    let updatedUsers = 0;

    for (const user of users) {
      const result = await executeOperationForUser(
        user.id,
        OperationId.GENERATE_CREDIT,
        undefined,
        {
          client,
          currentUser: user,
          globalTicketCount: 0,
          allowPrintAutoBuyFallback: false,
        },
      );

      if ((result.gain[ResourceType.CREDIT] ?? 0) > 0) {
        updatedUsers += 1;
      }
    }

    return updatedUsers;
  });
}
