"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const envFileCandidates = [
    node_path_1.default.resolve(process.cwd(), ".env"),
    node_path_1.default.resolve(process.cwd(), ".env.local"),
    node_path_1.default.resolve(process.cwd(), "apps/api/.env"),
    node_path_1.default.resolve(process.cwd(), "apps/api/.env.local"),
    node_path_1.default.resolve(__dirname, "../.env"),
    node_path_1.default.resolve(__dirname, "../.env.local"),
];
for (const envPath of envFileCandidates) {
    if (node_fs_1.default.existsSync(envPath)) {
        dotenv_1.default.config({ path: envPath, override: true });
    }
}
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to apps/api/.env or apps/api/.env.local.");
}
async function start() {
    const { buildServer } = require("./server");
    const app = await buildServer();
    try {
        await app.listen({
            port: 4000,
            host: "0.0.0.0",
        });
    }
    catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}
start();
