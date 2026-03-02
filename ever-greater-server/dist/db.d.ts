import { ResourceAmount, User } from "ever-greater-shared";
import { Pool, PoolClient } from "pg";
export declare const pool: Pool;
export declare function initializeDatabase(): Promise<void>;
export declare function getGlobalCount(): Promise<number>;
export declare function incrementGlobalCount(): Promise<number>;
interface DbUser extends User {
    password_hash: string;
    created_at: Date;
}
export declare function getUserByEmail(email: string): Promise<DbUser | null>;
export declare function createUser(email: string, passwordHash: string): Promise<User>;
export declare function getUserById(userId: number): Promise<User | null>;
export declare function executeResourceTransaction(userId: number, cost: ResourceAmount, gain: ResourceAmount, client?: PoolClient): Promise<User>;
export declare function processAutoprinters(): Promise<{
    totalTickets: number;
    newGlobalCount: number | null;
}>;
export declare function updateAllUsersCreditValues(): Promise<void>;
export declare function closePool(): Promise<void>;
export {};
//# sourceMappingURL=db.d.ts.map