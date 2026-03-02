/// <reference types="node" />
import "dotenv/config";
import { type Express } from "express";
import { type Server } from "http";
declare module "express-session" {
    interface SessionData {
        userId?: number;
    }
}
declare function createApp(): Express;
declare function createServer(app: Express): Server;
export { createApp, createServer };
//# sourceMappingURL=index.d.ts.map