// routes/fileRoutes.js

import express from "express";
import multer from "multer";
import { processImages, downloadFile } from "../controllers/fileController.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
}).array("images"); // Remove file count limit

export const fileRouter = express.Router();

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
