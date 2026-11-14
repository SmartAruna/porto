export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error?.name === "ZodError") {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "Periksa kembali data yang dikirim." }
    });
  }

  const status = Number.isInteger(error?.status) ? error.status : 500;
  const code = error?.code && typeof error.code === "string" && error.code.length < 40
    ? error.code
    : "INTERNAL_ERROR";
  if (status >= 500) console.error("Request failed:", error?.message ?? "Unknown error");

  return res.status(status).json({
    error: {
      code,
      message: status >= 500 ? "Terjadi gangguan pada server." : error.message
    }
  });
}
