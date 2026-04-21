"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = buildServer;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const track_1 = __importDefault(require("./routes/track"));
async function buildServer() {
    const app = (0, fastify_1.default)({
        logger: true,
    });
    await app.register(track_1.default, { prefix: "/track" });
    await app.register(cors_1.default, {
        origin: true,
    });
    app.get("/health", async () => {
        return { ok: true, service: "sequence-api" };
    });
    return app;
}
