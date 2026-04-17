import type { DatabaseMigration } from "./types.js";

export const normalizeCreditCapacityLevelMigration: DatabaseMigration = {
  id: 8,
  name: "normalize-credit-capacity-level",
  statements: [
    `
      UPDATE users
      SET
        credit_capacity_level = converted.level_count,
        credit_value = LEAST(credit_value, converted.level_count * 20)
      FROM (
        SELECT
          id,
          CEIL(GREATEST(credit_capacity_level, 0)::NUMERIC / 20)::INTEGER AS level_count
        FROM users
      ) AS converted
      WHERE users.id = converted.id
    `,
  ],
};
