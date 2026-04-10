export function errorHandler(err, req, res, _next) {
  if (err?.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB."
        : err.message || "Upload file không hợp lệ.";

    return res.status(400).json({
      message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
  }

  const status =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(status).json({
    message: err.message || "Server error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}
