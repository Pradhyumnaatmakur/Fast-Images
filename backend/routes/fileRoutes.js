import express from "express";
import multer from "multer";
import {
  handleImageProcessing,
  handleFileDownload,
  handleBulkDownload,
} from "../controllers/fileController.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
}).array("images");

export const fileRouter = express.Router(); //

const handleUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: "File upload error",
        error: err.message,
      });
    } else if (err) {
      return res.status(500).json({
        message: "Server error during upload",
        error: err.message,
      });
    }
    next();
  });
};

// Routes
fileRouter.post("/convert", handleUpload, handleImageProcessing);
fileRouter.get("/download/:fileId", handleFileDownload);
fileRouter.post("/download-all", handleBulkDownload);
