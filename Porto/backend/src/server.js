import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import { redis } from "./redis.js";

let server;

async function start() {
  await pool.query("SELECT 1");
  await redis.connect();
  await redis.ping();

  server = app.listen(config.PORT, "0.0.0.0", () => {
    console.log(`NARA API listening on port ${config.PORT}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down gracefully.`);
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  await Promise.allSettled([pool.end(), redis.quit()]);
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch(async (error) => {
  console.error("NARA API failed to start:", error.message);
  await Promise.allSettled([pool.end(), redis.quit()]);
  process.exit(1);
});
