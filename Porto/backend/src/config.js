import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32).refine((value) => !value.toLowerCase().startsWith("replace-"), "JWT_SECRET must be replaced with a unique random secret"),
  CORS_ORIGIN: z.string().url().default("http://localhost:5500"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(20)
});

const result = schema.safeParse(process.env);
if (!result.success) {
  const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid backend configuration: ${issues}`);
}

export const config = result.data;
