import { HttpError } from "./http.js";
import { redis } from "./redis.js";

const incrementScript = `
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
  return { count, redis.call('PTTL', KEYS[1]) }
`;

export function rateLimit({ name, limit, windowMs }) {
  return async (req, res, next) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    const key = `nara:rate:${name}:${clientIp}`;

    try {
      const [count, ttl] = await redis.eval(incrementScript, 1, key, windowMs);
      const remaining = Math.max(0, limit - Number(count));
      res.set("RateLimit-Limit", String(limit));
      res.set("RateLimit-Remaining", String(remaining));
      res.set("RateLimit-Reset", String(Math.ceil(Date.now() / 1000 + Number(ttl) / 1000)));

      if (Number(count) > limit) {
        res.set("Retry-After", String(Math.max(1, Math.ceil(Number(ttl) / 1000))));
        return next(new HttpError(429, "Terlalu banyak permintaan. Silakan coba lagi sebentar.", "RATE_LIMITED"));
      }

      return next();
    } catch (error) {
      console.error("Rate limiter unavailable:", error.message);
      return next(new HttpError(503, "Layanan sedang sibuk. Coba lagi sebentar.", "RATE_LIMIT_UNAVAILABLE"));
    }
  };
}
