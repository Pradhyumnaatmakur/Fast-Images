// routes/fileRoutes.js

import express from "express";
import multer from "multer";
import { processImages, downloadFile } from "../controllers/fileController.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
}).array("images", 10); // Field name is "images"

export const fileRouter = express.Router();

// Wrap upload middleware to handle errors
const handleUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    next();
  });
};

fileRouter.post("/convert", handleUpload, processImages);
fileRouter.get("/download/:fileId", downloadFile);
