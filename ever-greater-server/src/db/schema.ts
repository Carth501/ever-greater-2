import { RESOURCE_DB_FIELDS } from "ever-greater-shared";
import type { PoolClient } from "pg";
import { withPoolClient } from "./core.js";
import {
  databaseMigrations,
  type DatabaseMigration,
} from "./migrations/index.js";

const MIGRATIONS_TABLE_NAME = "schema_migrations";

async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE_NAME} (
      id INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrationIds(
  client: PoolClient,
): Promise<Set<number>> {
  const result = await client.query(
    `SELECT id FROM ${MIGRATIONS_TABLE_NAME} ORDER BY id ASC`,
  );

  return new Set(
    result.rows.map((row: { id: number | string }) => Number(row.id)),
  );
}

async function applyMigration(
  client: PoolClient,
  migration: DatabaseMigration,
): Promise<void> {
  await client.query("BEGIN");
  try {
    for (const statement of migration.statements) {
      await client.query(statement);
    }

    await client.query(
      `
        INSERT INTO ${MIGRATIONS_TABLE_NAME} (id, name)
        VALUES ($1, $2)
      `,
      [migration.id, migration.name],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function runPendingMigrations(client: PoolClient): Promise<void> {
  await ensureMigrationsTable(client);
  const appliedMigrationIds = await getAppliedMigrationIds(client);

  for (const migration of databaseMigrations) {
    if (appliedMigrationIds.has(migration.id)) {
      continue;
    }

    await applyMigration(client, migration);
  }
}

async function validateResourceMappings(client: PoolClient): Promise<void> {
  const columnsResult = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`,
  );
  const existingColumns = new Set(
    columnsResult.rows.map((row: { column_name: string }) => row.column_name),
  );

  for (const mappedField of Object.values(RESOURCE_DB_FIELDS)) {
    if (!existingColumns.has(mappedField)) {
      throw new Error(
        `Resource mapping validation failed: users.${mappedField} does not exist`,
      );
    }
  }
}

async function ensureGlobalStateSeed(client: PoolClient): Promise<void> {
  const result = await client.query("SELECT COUNT(*) FROM global_state");
  const rowCount = Number.parseInt(result.rows[0].count, 10);

  if (rowCount === 0) {
    await client.query(`
      INSERT INTO global_state (id, count)
      VALUES (1, 0)
    `);
  }
}

export async function initializeDatabase(): Promise<void> {
  return withPoolClient(async (client) => {
    await runPendingMigrations(client);
    await validateResourceMappings(client);
    await ensureGlobalStateSeed(client);
  });
}
