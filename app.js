import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { authenticate, currentUser, login, register } from "./auth.js";
import { deleteCartItem, getCart, putCartItem } from "./cart.js";
import { pool } from "./db.js";
import { asyncHandler, errorHandler } from "./http.js";
import { listProducts } from "./products.js";
import { rateLimit } from "./rate-limit.js";
import { redis } from "./redis.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", config.TRUST_PROXY_HOPS);
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, methods: ["GET", "POST", "PUT", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "16kb", strict: true }));

app.get("/health/live", (req, res) => res.status(200).json({ status: "ok" }));
app.get("/health/ready", asyncHandler(async (req, res) => {
  await Promise.all([pool.query("SELECT 1"), redis.ping()]);
  return res.status(200).json({ status: "ready" });
}));

app.use("/api", rateLimit({ name: "api", limit: 300, windowMs: 60_000 }));
app.post("/api/auth/register", rateLimit({ name: "register", limit: 5, windowMs: 15 * 60_000 }), register);
app.post("/api/auth/login", rateLimit({ name: "login", limit: 10, windowMs: 15 * 60_000 }), login);
app.get("/api/auth/me", authenticate, currentUser);
app.get("/api/products", listProducts);
app.get("/api/cart", authenticate, getCart);
app.put("/api/cart/items/:productId", authenticate, putCartItem);
app.delete("/api/cart/items/:productId", authenticate, deleteCartItem);

app.use((req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint tidak ditemukan." } }));
app.use((error, req, res, next) => {
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ error: { code: "INVALID_JSON", message: "Format JSON tidak valid." } });
  }
  return errorHandler(error, req, res, next);
});
