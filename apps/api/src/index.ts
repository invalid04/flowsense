import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const envFileCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), "apps/api/.env"),
  path.resolve(process.cwd(), "apps/api/.env.local"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../.env.local"),
];

for (const envPath of envFileCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to apps/api/.env or apps/api/.env.local."
  );
}

async function start() {
  const { buildServer } = require("./server");

  const app = await buildServer();

  try {
    await app.listen({
      port: 4000,
      host: "0.0.0.0",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
