import { withPoolClient, withTransaction } from "./core.js";

export async function processAutoprinters(): Promise<{
  totalTickets: number;
  newGlobalCount: number | null;
}> {
  return withTransaction(async (client) => {
    await client.query(`
      UPDATE users
      SET
        gold = gold - 1,
        printer_supplies = printer_supplies + 200
      WHERE
        auto_buy_supplies_active = TRUE
        AND auto_buy_supplies_purchased = TRUE
        AND printer_supplies < autoprinters
        AND autoprinters > 0
        AND gold >= 1
    `);

    const usersResult = await client.query(`
      UPDATE users
      SET
        printer_supplies = printer_supplies - LEAST(autoprinters, printer_supplies),
        money = money + LEAST(autoprinters, printer_supplies),
        tickets_contributed = tickets_contributed + LEAST(autoprinters, printer_supplies)
      WHERE autoprinters > 0 AND printer_supplies > 0
      RETURNING LEAST(autoprinters, printer_supplies) as tickets_printed
    `);

    const totalTickets = usersResult.rows.reduce(
      (sum: number, row: { tickets_printed: number }) =>
        sum + row.tickets_printed,
      0,
    );

    let newGlobalCount: number | null = null;
    if (totalTickets > 0) {
      const globalResult = await client.query(
        "UPDATE global_state SET count = count + $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING count",
        [totalTickets],
      );
      newGlobalCount = globalResult.rows[0].count;
    }

    return { totalTickets, newGlobalCount };
  });
}

export async function updateAllUsersCreditValues(): Promise<number> {
  return withPoolClient(async (client) => {
    const result = await client.query(`
      UPDATE users
      SET credit_value = LEAST(
        credit_value + credit_generation_level / 10.0,
        credit_capacity_level
      )
      WHERE credit_generation_level > 0 OR credit_value < credit_capacity_level
    `);
    return result.rowCount || 0;
  });
}
