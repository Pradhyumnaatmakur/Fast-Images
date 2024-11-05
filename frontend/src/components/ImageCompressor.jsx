import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const ImageCompressor = () => {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState("webp");
  const [quality, setQuality] = useState(80);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [fileProgress, setFileProgress] = useState({});
  const [results, setResults] = useState([]);
  const [beforeSize, setBeforeSize] = useState(0);
  const [afterSize, setAfterSize] = useState(0);
  const [alreadyOptimizedFiles, setAlreadyOptimizedFiles] = useState(new Set());

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
      Accept: "application/json",
    },
  });

  const removeFileExtension = (filename) => {
    return filename.replace(/\.[^/.]+$/, "");
  };

  const formatBytes = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes === 0) return "0 KB";
    const k = 1024;
    return `${(bytes / k).toFixed(2)} KB`;
  };

  const onDrop = useCallback((acceptedFiles) => {
    const totalOriginalSize = acceptedFiles.reduce(
      (acc, file) => acc + file.size,
      0
    );
    setBeforeSize(totalOriginalSize);
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((file) => ({
        file,
        originalSize: file.size,
        id: Math.random().toString(36).substr(2, 9),
      })),
    ]);
    setAlreadyOptimizedFiles(new Set());
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
  });

  const handleDownload = async (fileId, originalName) => {
    try {
      setDownloading(true);
      const response = await api.get(`/api/files/download/${fileId}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `${originalName}.${format}`;

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download file");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;

    setDownloading(true);
    try {
      const response = await api.post(
        "/api/files/download-all",
        { fileIds: results.map((r) => r.fileId) },
        {
          responseType: "blob",
          headers: {
            Accept: "application/zip",
          },
        }
      );

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "compressed-images.zip");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("All images downloaded successfully");
    } catch (error) {
      console.error("Download all failed:", error);
      toast.error("Failed to download files");
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setFileProgress({});
    setAlreadyOptimizedFiles(new Set());

    const formData = new FormData();
    files.forEach(({ file }) => formData.append("images", file));
    formData.append("format", format);
    formData.append("quality", quality);

    try {
      const response = await api.post("/api/files/convert", formData, {
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          const newProgress = {};
          files.forEach(({ id }) => {
            newProgress[id] = progress;
          });
          setFileProgress(newProgress);
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const calculateSizeReduction = () => {
        if (beforeSize && afterSize) {
          const reduction = beforeSize - afterSize;
          return reduction > 0 ? reduction : 0;
        }
        return 0;
      };

      const calculateCompressionPercentage = () => {
        if (beforeSize && afterSize && beforeSize > afterSize) {
          return (((beforeSize - afterSize) / beforeSize) * 100).toFixed(1);
        }
        return 0;
      };

      const processedFiles = response.data.processed;
      const optimizedFiles = new Set();
      let totalCompressedSize = 0;

      processedFiles.forEach((processedFile) => {
        const originalFile = files.find(
          (f) =>
            removeFileExtension(f.file.name) ===
            removeFileExtension(processedFile.originalName)
        );

        if (processedFile.size > originalFile.file.size) {
          optimizedFiles.add(processedFile.originalName);
          totalCompressedSize += originalFile.file.size;
        } else {
          totalCompressedSize += processedFile.size;
        }
      });

      setAlreadyOptimizedFiles(optimizedFiles);
      setResults(processedFiles);
      setAfterSize(totalCompressedSize);

      if (optimizedFiles.size === files.length) {
        toast.info(
          `All files are already optimized. Try changing quality or format.`,
          { duration: 4000 }
        );
      } else if (optimizedFiles.size > 0) {
        toast.info(
          `${optimizedFiles.size} file(s) are already optimized and will keep their original size.`,
          { duration: 4000 }
        );

        const reduction = (
          ((beforeSize - totalCompressedSize) / beforeSize) *
          100
        ).toFixed(1);
        if (reduction > 0) {
          toast.success(`Other files compressed by ${reduction}%`);
        }
      } else {
        const reduction = (
          ((beforeSize - totalCompressedSize) / beforeSize) *
          100
        ).toFixed(1);
        toast.success(`Successfully compressed images by ${reduction}%`);
      }

      const completedProgress = {};
      files.forEach(({ id }) => {
        completedProgress[id] = 100;
      });
      setFileProgress(completedProgress);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to process images");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 bg-black text-white min-h-screen">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ease-in-out mb-8
          ${
            isDragActive
              ? "border-white bg-gray-800"
              : "border-gray-400 hover:border-gray-200"
          }`}
      >
        <input {...getInputProps()} />
        <ArrowUpTrayIcon className="h-16 w-16 mx-auto text-gray-400" />
        <p className="mt-4 text-lg text-gray-400">
          Drag & drop images here, or click to select files
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex items-center space-x-4">
          <label className="text-lg font-medium whitespace-nowrap">
            Convert to:
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="flex-1 p-2 text-base bg-black text-white border-2 border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          >
            <option value="webp">WebP</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-lg font-medium whitespace-nowrap">
            Quality: {quality}%
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Compress Button */}
      <div className="flex justify-center w-full mb-8">
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full md:w-2/3 bg-white text-black py-3 md:py-4 px-6 md:px-8 text-lg md:text-xl font-bold rounded-lg hover:bg-gray-200 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out"
        >
          {uploading ? "Processing..." : "Compress Images"}
        </button>
      </div>

      {/* Statistics */}
      {beforeSize > 0 && afterSize > 0 && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white/10 rounded-lg">
            <p className="text-lg font-medium mb-2">Original Size</p>
            <p className="text-2xl font-bold">{formatBytes(beforeSize)}</p>
          </div>
          <div className="p-6 bg-white/10 rounded-lg">
            <p className="text-lg font-medium mb-2">Compressed Size</p>
            <p className="text-2xl font-bold">{formatBytes(afterSize)}</p>
          </div>
          <div className="p-6 bg-white/10 rounded-lg">
            <p className="text-lg font-medium mb-2">Space Saved</p>
            <p className="text-2xl font-bold">
              {calculateCompressionPercentage()}%
              <span className="text-base ml-2 text-gray-400">
                ({formatBytes(calculateSizeReduction())})
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Download All Button */}
      {results.length > 0 && (
        <div className="mb-8 flex justify-center">
          <button
            onClick={handleDownloadAll}
            disabled={downloading || uploading}
            className="w-full md:w-2/3 bg-white/10 text-white py-3 px-6 rounded-lg hover:bg-white/20 transition-colors duration-200 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Download All as ZIP
          </button>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          {files.map((file) => {
            const progress = fileProgress[file.id] || 0;
            const isComplete = progress === 100;
            const result = results.find(
              (r) =>
                removeFileExtension(r.originalName) ===
                removeFileExtension(file.file.name)
            );
            const isAlreadyOptimized = alreadyOptimizedFiles.has(
              file.file.name
            );

            return (
              <div
                key={file.id}
                className={`flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg transition-colors duration-200 ease-in-out ${
                  isAlreadyOptimized
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-gray-400 hover:border-gray-200"
                }`}
              >
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-lg text-white">
                      {removeFileExtension(file.file.name)}
                    </p>
                    {isAlreadyOptimized && (
                      <span className="text-yellow-500 text-sm">
                        Already optimized
                      </span>
                    )}
                  </div>
                  {(uploading || progress > 0) && (
                    <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
                      <div
                        className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {isComplete && result && (
                  <button
                    onClick={() =>
                      handleDownload(
                        result.fileId,
                        removeFileExtension(result.originalName)
                      )
                    }
                    className="w-full sm:w-auto bg-white text-black py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200 ease-in-out flex items-center justify-center gap-2 min-w-[140px] text-lg disabled:bg-gray-600"
                    disabled={downloading}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Download
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;
