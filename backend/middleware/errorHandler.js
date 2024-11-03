// middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Handle Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large",
      error: err.message,
    });
  }

  // Handle file type errors
  if (err.message.includes("Only image files are allowed")) {
    return res.status(400).json({
      message: "Invalid file type",
      error: err.message,
    });
  }

  // Handle general errors
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
