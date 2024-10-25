// controllers/fileController.js

import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

// In-memory storage for processed files
const processedFiles = new Map();

// Cleanup old files every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, value] of processedFiles.entries()) {
    if (value.timestamp < oneHourAgo) {
      processedFiles.delete(key);
    }
  }
}, 3600000);

// Helper function to get correct extension and mime type
const getFormatInfo = (format) => {
  switch (format.toLowerCase()) {
    case "webp":
      return { ext: "webp", mime: "image/webp" };
    case "jpeg":
    case "jpg":
      return { ext: "jpg", mime: "image/jpeg" };
    case "png":
      return { ext: "png", mime: "image/png" };
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};

// Process a single image with error handling and delay
const processSingleImage = async (file, format, quality) => {
  try {
    const formatInfo = getFormatInfo(format);

    let processedImage = sharp(file.buffer);

    // Get image metadata
    const metadata = await processedImage.metadata();

    // Apply compression based on format
    switch (format.toLowerCase()) {
      case "webp":
        processedImage = processedImage.webp({ quality });
        break;
      case "jpeg":
      case "jpg":
        processedImage = processedImage.jpeg({ quality });
        break;
      case "png":
        processedImage = processedImage.png({ quality });
        break;
    }

    const processedBuffer = await processedImage.toBuffer();
    const fileId = uuidv4();

    // Store processed file with additional metadata
    processedFiles.set(fileId, {
      buffer: processedBuffer,
      originalName: file.originalname,
      format: formatInfo.ext,
      mime: formatInfo.mime,
      timestamp: Date.now(),
      metadata: {
        width: metadata.width,
        height: metadata.height,
        size: processedBuffer.length,
      },
    });

    return {
      fileId,
      originalName: file.originalname,
      format: formatInfo.ext,
      size: processedBuffer.length,
      dimensions: {
        width: metadata.width,
        height: metadata.height,
      },
    };
  } catch (error) {
    console.error(`Error processing file ${file.originalname}:`, error);
    throw new Error(`Failed to process ${file.originalname}: ${error.message}`);
  }
};

// Process files sequentially with delay
const processFilesSequentially = async (files, format, quality) => {
  const results = [];
  const failures = [];

  for (const file of files) {
    try {
      // Add delay between processing files
      if (results.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const result = await processSingleImage(file, format, quality);
      results.push(result);
    } catch (error) {
      failures.push({
        fileName: file.originalname,
        error: error.message,
      });
    }
  }

  return { results, failures };
};

export const processImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const format = req.body.format || "webp";
    const quality = parseInt(req.body.quality) || 80;

    if (quality < 1 || quality > 100) {
      return res
        .status(400)
        .json({ message: "Quality must be between 1 and 100" });
    }

    const { results, failures } = await processFilesSequentially(
      req.files,
      format,
      quality
    );

    res.json({
      success: results.length > 0,
      processed: results,
      failures,
      totalProcessed: results.length,
      totalFailed: failures.length,
    });
  } catch (error) {
    console.error("Image processing error:", error);
    res.status(500).json({
      message: "Error processing images",
      error: error.message,
    });
  }
};

export const downloadFile = (req, res) => {
  const { fileId } = req.params;
  const file = processedFiles.get(fileId);

  if (!file) {
    return res.status(404).json({ message: "File not found or expired" });
  }

  // Generate clean filename without original extension
  const baseFileName = file.originalName.split(".")[0];
  const fileName = `${baseFileName}.${file.format}`;

  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  res.setHeader("Content-Type", file.mime);
  res.send(file.buffer);
};
