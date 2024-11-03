import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import JSZip from "jszip";

// Constants for batch processing
const BATCH_SIZE = 5;
const MAX_CONCURRENT_BATCHES = 2;

// LRU Cache implementation
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

// Helper function to get format information
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

// Process a single image
export async function processSingleImage(file, format, quality) {
  try {
    const formatInfo = getFormatInfo(format);
    let processedImage = sharp(file.buffer);
    const metadata = await processedImage.metadata();

    // Process image based on format
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

    // Store complete file information
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
}

// Process files in batches
const processFilesBatched = async (files, format, quality) => {
  const results = [];
  const failures = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (file) => {
      try {
        const result = await processSingleImage(file, format, quality);
        return { success: true, result };
      } catch (error) {
        return {
          success: false,
          error: { fileName: file.originalname, error: error.message },
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach((item) => {
      if (item.success) {
        results.push(item.result);
      } else {
        failures.push(item.error);
      }
    });

    if (i + BATCH_SIZE < files.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return { results, failures };
};

// Controller function for handling image processing
export async function handleImageProcessing(req, res) {
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

    return res.json({
      success: results.length > 0,
      processed: results,
      failures,
      totalProcessed: results.length,
      totalFailed: failures.length,
    });
  } catch (error) {
    console.error("Image processing error:", error);
    return res.status(500).json({
      message: "Error processing images",
      error: error.message,
    });
  }
}

// Controller function for downloading a single file
export async function handleFileDownload(req, res) {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({ message: "File ID is required" });
    }

    const file = processedFiles.get(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found or expired" });
    }

    if (!file.buffer || !file.mime || !file.format || !file.originalName) {
      console.error("Invalid file data:", file);
      return res.status(500).json({ message: "Invalid file data in cache" });
    }

    const fileName = `${file.originalName}.${file.format}`;

    // Log the file details for debugging
    console.log("Sending file:", {
      id: fileId,
      name: fileName,
      mime: file.mime,
      size: file.buffer.length,
    });

    // Set headers
    res.set({
      "Content-Type": file.mime,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        fileName
      )}"`,
      "Content-Length": file.buffer.length,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Send the file
    return res.send(file.buffer);
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({
      message: "Error downloading file",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

// Controller function for downloading all files as ZIP
export async function handleBulkDownload(req, res) {
  try {
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ message: "No valid file IDs provided" });
    }

    const zip = new JSZip();
    const validFiles = [];

    for (const fileId of fileIds) {
      const file = processedFiles.get(fileId);
      if (file && file.buffer) {
        validFiles.push(file);
        zip.file(`${file.originalName}.${file.format}`, file.buffer);
      }
    }

    if (validFiles.length === 0) {
      return res.status(404).json({ message: "No valid files found" });
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=compressed-images.zip"
    );
    res.setHeader("Content-Length", zipBuffer.length);
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Pragma", "no-cache");
    return res.send(zipBuffer);
  } catch (error) {
    console.error("Error creating zip:", error);
    return res.status(500).json({
      message: "Error creating zip file",
      error: error.message,
    });
  }
}

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
