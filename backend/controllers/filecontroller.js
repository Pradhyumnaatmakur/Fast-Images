// controllers/fileController.js

import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

// Configurable chunk size for batch processing
const BATCH_SIZE = 5;
const MAX_CONCURRENT_BATCHES = 2;

// LRU Cache implementation for processed files
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.queue = [];
  }

  set(key, value) {
    if (this.queue.length >= this.maxSize) {
      const oldestKey = this.queue.shift();
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
    this.queue.push(key);
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    // Move to end of queue (most recently used)
    this.queue = this.queue.filter((k) => k !== key);
    this.queue.push(key);
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.queue = this.queue.filter((k) => k !== key);
  }
}

const processedFiles = new LRUCache(100);

// Cleanup old files every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const key of processedFiles.queue) {
    const value = processedFiles.get(key);
    if (value.timestamp < oneHourAgo) {
      processedFiles.delete(key);
    }
  }
}, 3600000);

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

const processSingleImage = async (file, format, quality) => {
  try {
    const formatInfo = getFormatInfo(format);

    let processedImage = sharp(file.buffer);
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

    // Clear file buffer to free memory
    file.buffer = null;

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

// Process files in batches with concurrent execution
const processFilesBatched = async (files, format, quality) => {
  const results = [];
  const failures = [];

  // Split files into batches
  const batches = [];
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    batches.push(files.slice(i, i + BATCH_SIZE));
  }

  // Process batches with limited concurrency
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
    const currentBatches = batches.slice(i, i + MAX_CONCURRENT_BATCHES);

    const batchPromises = currentBatches.map((batch) =>
      Promise.all(
        batch.map(async (file) => {
          try {
            const result = await processSingleImage(file, format, quality);
            return { success: true, result };
          } catch (error) {
            return {
              success: false,
              error: {
                fileName: file.originalname,
                error: error.message,
              },
            };
          }
        })
      )
    );

    const batchResults = await Promise.all(batchPromises);

    // Collect results and failures
    batchResults.flat().forEach((item) => {
      if (item.success) {
        results.push(item.result);
      } else {
        failures.push(item.error);
      }
    });

    // Add small delay between batches to prevent overwhelming the system
    if (i + MAX_CONCURRENT_BATCHES < batches.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
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

    const { results, failures } = await processFilesBatched(
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

  const baseFileName = file.originalName.split(".")[0];
  const fileName = `${baseFileName}.${file.format}`;

  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  res.setHeader("Content-Type", file.mime);
  res.send(file.buffer);
};
