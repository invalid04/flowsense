import Fastify from "fastify";
import cors from "@fastify/cors";
import trackRoute from "./routes/track";
import predictRoute from "./routes/predict";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  app.get("/health", async () => {
    return { ok: true, service: "sequence-api" };
  });

  await app.register(trackRoute, { prefix: "/track" });
  await app.register(predictRoute, { prefix: "/predict" });

  return app;
}