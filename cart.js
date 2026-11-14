import { z } from "zod";
import { pool } from "./db.js";
import { asyncHandler, HttpError } from "./http.js";

const idSchema = z.string().uuid();
const quantitySchema = z.object({ quantity: z.number().int().min(1).max(99) });

export const getCart = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT p.id AS "productId", p.name, p.category, p.price::text AS price,
            p.image_url AS "imageUrl", p.stock, c.quantity
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     WHERE c.user_id = $1 AND p.active = true
     ORDER BY c.updated_at DESC`,
    [req.user.id]
  );
  return res.json({ data: result.rows });
});

export const putCartItem = asyncHandler(async (req, res) => {
  const productId = idSchema.parse(req.params.productId);
  const { quantity } = quantitySchema.parse(req.body);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const product = await client.query(
      "SELECT stock FROM products WHERE id = $1 AND active = true FOR SHARE",
      [productId]
    );
    if (!product.rows[0]) throw new HttpError(404, "Produk tidak ditemukan.", "PRODUCT_NOT_FOUND");
    if (quantity > product.rows[0].stock) {
      throw new HttpError(409, "Jumlah melebihi stok yang tersedia.", "INSUFFICIENT_STOCK");
    }

    await client.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()`,
      [req.user.id, productId, quantity]
    );
    await client.query("COMMIT");
    return res.status(200).json({ data: { productId, quantity } });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

export const deleteCartItem = asyncHandler(async (req, res) => {
  const productId = idSchema.parse(req.params.productId);
  await pool.query("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", [req.user.id, productId]);
  return res.status(204).end();
});
