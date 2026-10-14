/**
 * Starts the app for Playwright against an ephemeral PostgreSQL: migrates,
 * imports the e2e line-up and runs `next start`. Never touches real data.
 */
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

const port = process.env.E2E_PORT ?? "3100";
const container = await new PostgreSqlContainer("postgres:17-alpine").start();

const env = {
  ...process.env,
  DATABASE_URL: container.getConnectionUri(),
  AUTH_SECRET: randomBytes(32).toString("hex"),
  AUTH_GOOGLE_ID: "e2e-google-client",
  AUTH_GOOGLE_SECRET: "e2e-google-secret",
  AUTH_TRUST_HOST: "true",
  E2E: "1",
};

execFileSync("npx", ["prisma", "migrate", "deploy"], { env, stdio: ["ignore", "inherit", "inherit"] });
execFileSync("npx", ["tsx", "scripts/import-lineup.mts", "tests/fixtures/lineup/e2e.csv"], { env, stdio: ["ignore", "inherit", "inherit"] });

const server = spawn("npx", ["next", "start", "--port", port], { env, stdio: ["ignore", "inherit", "inherit"] });

const shutdown = async () => {
  server.kill("SIGTERM");
  await container.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
server.on("exit", async (code) => {
  await container.stop();
  process.exit(code ?? 0);
});
