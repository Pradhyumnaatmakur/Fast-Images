// middleware/errorHandler.js

import multer from "multer";

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          message: "File too large",
          error: "File size limit exceeded (10MB max)",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          message: "Too many files",
          error: "Maximum 10 files allowed",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          message: "Unexpected field",
          error: 'Check that you are using the correct field name "images"',
        });
      default:
        return res.status(400).json({
          message: "File upload error",
          error: err.message,
        });
    }
  }

  // Handle other errors
  res.status(500).json({
    message: "Internal server error",
    error: err.message,
  });
};
