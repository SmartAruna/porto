import { createHash } from "node:crypto";
import { z } from "zod";
import { pool } from "./db.js";
import { redis } from "./redis.js";
import { asyncHandler } from "./http.js";

const querySchema = z.object({
  category: z.enum(["Fashion", "Aksesori", "Lifestyle"]).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const listProducts = asyncHandler(async (req, res) => {
  const filters = querySchema.parse(req.query);
  const cacheKey = `nara:products:${createHash("sha256").update(JSON.stringify(filters)).digest("hex")}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.set("Cache-Control", "public, max-age=15, stale-while-revalidate=30");
      return res.json(JSON.parse(cached));
    }
  } catch (error) {
    console.warn("Product cache read failed; querying PostgreSQL:", error.message);
  }

  const values = [];
  const conditions = ["active = true"];
  if (filters.category) {
    values.push(filters.category);
    conditions.push(`category = $${values.length}`);
  }
  if (filters.q) {
    values.push(`%${filters.q}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }

  const where = conditions.join(" AND ");
  const countResult = await pool.query(`SELECT count(*)::integer AS total FROM products WHERE ${where}`, values);
  const total = countResult.rows[0].total;
  const offset = (filters.page - 1) * filters.limit;
  const listValues = [...values, filters.limit, offset];
  const productsResult = await pool.query(
    `SELECT id, name, category, price::text AS price, image_url AS "imageUrl", tag, stock
     FROM products WHERE ${where}
     ORDER BY created_at DESC, id
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues
  );

  const payload = {
    data: productsResult.rows,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };

  try {
    await redis.set(cacheKey, JSON.stringify(payload), "EX", 30);
  } catch (error) {
    console.warn("Product cache write failed:", error.message);
  }

  res.set("Cache-Control", "public, max-age=15, stale-while-revalidate=30");
  return res.json(payload);
});
