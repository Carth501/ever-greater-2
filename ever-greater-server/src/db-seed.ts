import bcrypt from "bcryptjs";
import { getDefaultAutoBuySettings } from "ever-greater-shared";
import { assertSeedCommandAllowed } from "./db-script-utils.js";
import {
  closePool,
  initializeDatabase,
  pool,
  STARTING_PRINTER_SUPPLIES,
} from "./db.js";

const DEMO_USER_EMAIL = "demo@example.com";
const DEMO_USER_PASSWORD = "demo1234";
const DEMO_GLOBAL_COUNT = 250;

async function runSeedCommand(): Promise<void> {
  try {
    assertSeedCommandAllowed();
    await initializeDatabase();

    const passwordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 10);
    const result = await pool.query(
      `
        INSERT INTO users (
          email,
          password_hash,
          tickets_contributed,
          printer_supplies,
          money,
          gold,
          gems,
          autoprinters,
          credit_value,
          money_per_ticket_level,
          credit_generation_level,
          credit_capacity_level,
          ticket_batch_level,
          auto_buy_supplies_purchased,
          auto_buy_supplies_active,
          auto_buy_settings
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (email)
        DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          tickets_contributed = EXCLUDED.tickets_contributed,
          printer_supplies = EXCLUDED.printer_supplies,
          money = EXCLUDED.money,
          gold = EXCLUDED.gold,
          gems = EXCLUDED.gems,
          autoprinters = EXCLUDED.autoprinters,
          credit_value = EXCLUDED.credit_value,
          money_per_ticket_level = EXCLUDED.money_per_ticket_level,
          credit_generation_level = EXCLUDED.credit_generation_level,
          credit_capacity_level = EXCLUDED.credit_capacity_level,
          ticket_batch_level = EXCLUDED.ticket_batch_level,
          auto_buy_supplies_purchased = EXCLUDED.auto_buy_supplies_purchased,
          auto_buy_supplies_active = EXCLUDED.auto_buy_supplies_active,
          auto_buy_settings = EXCLUDED.auto_buy_settings
        RETURNING id, email
      `,
      [
        DEMO_USER_EMAIL,
        passwordHash,
        120,
        STARTING_PRINTER_SUPPLIES * 4,
        250,
        25,
        0,
        4,
        6,
        0,
        8,
        12,
        0,
        true,
        true,
        getDefaultAutoBuySettings(),
      ],
    );

    await pool.query(
      `
        INSERT INTO global_state (id, count)
        VALUES (1, $1)
        ON CONFLICT (id)
        DO UPDATE SET count = EXCLUDED.count, updated_at = CURRENT_TIMESTAMP
      `,
      [DEMO_GLOBAL_COUNT],
    );

    await pool.query("DELETE FROM ticket_withdrawals WHERE user_id = $1", [
      result.rows[0].id,
    ]);

    console.log(
      `Database seeded with demo user ${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD} and global count ${DEMO_GLOBAL_COUNT}`,
    );
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exitCode = 1;
  } finally {
    try {
      await closePool();
    } catch (error) {
      console.error("Failed to close database pool after seed:", error);
      process.exitCode = 1;
    }
  }
}

void runSeedCommand();
