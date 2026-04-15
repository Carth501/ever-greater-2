export type DatabaseMigration = {
  id: number;
  name: string;
  statements: readonly string[];
};
