import Redis from "ioredis";
import { config } from "./config.js";

export const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy: (attempt) => Math.min(attempt * 200, 2_000)
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});
