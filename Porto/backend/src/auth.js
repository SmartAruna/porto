import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config.js";
import { pool } from "./db.js";
import { asyncHandler, HttpError } from "./http.js";

const passwordSchema = z.string().min(10).max(128);
const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema
});
const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

function issueToken(user) {
  return jwt.sign({ sub: user.id }, config.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "15m",
    issuer: "nara-api",
    audience: "nara-web"
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

export const register = asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, 12);

  let result;
  try {
    result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [input.name, input.email, passwordHash]
    );
  } catch (error) {
    if (error.code === "23505") {
      throw new HttpError(409, "Email sudah terdaftar.", "EMAIL_IN_USE");
    }
    throw error;
  }

  const user = result.rows[0];
  return res.status(201).json({ data: { user: publicUser(user), accessToken: issueToken(user) } });
});

export const login = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const result = await pool.query(
    "SELECT id, name, email, password_hash FROM users WHERE lower(email) = $1",
    [input.email]
  );
  const user = result.rows[0];
  const passwordMatches = user
    ? await bcrypt.compare(input.password, user.password_hash)
    : false;

  if (!passwordMatches) {
    throw new HttpError(401, "Email atau kata sandi tidak valid.", "INVALID_CREDENTIALS");
  }

  return res.json({ data: { user: publicUser(user), accessToken: issueToken(user) } });
});

export const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.get("authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Silakan masuk untuk melanjutkan.", "AUTHENTICATION_REQUIRED");
  }

  let claims;
  try {
    claims = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "nara-api",
      audience: "nara-web"
    });
  } catch {
    throw new HttpError(401, "Sesi tidak valid atau sudah berakhir. Silakan masuk kembali.", "INVALID_TOKEN");
  }

  const result = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [claims.sub]);
  if (!result.rows[0]) throw new HttpError(401, "Akun tidak ditemukan.", "INVALID_TOKEN");
  req.user = result.rows[0];
  return next();
});

export const currentUser = (req, res) => res.json({ data: { user: publicUser(req.user) } });
