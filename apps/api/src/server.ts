import Fastify from "fastify";
import cors from "@fastify/cors";
import trackRoute from "./routes/track";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(trackRoute, { prefix: "/track" });

  await app.register(cors, {
    origin: true,
  });

  app.get("/health", async () => {
    return { ok: true, service: "sequence-api" };
  });

  return app;
}