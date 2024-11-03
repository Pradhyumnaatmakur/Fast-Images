import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const ImageCompressor = () => {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState("webp");
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [totalSaved, setTotalSaved] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        originalSize: file.size,
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
  });

  const getFileNameWithoutExtension = (filename) => {
    return filename.replace(/\.[^/.]+$/, "");
  };

  const handleDownload = async (fileId, originalName) => {
    try {
      setDownloading(true);
      const response = await axios({
        url: `http://localhost:5000/api/files/download/${fileId}`,
        method: "GET",
        responseType: "blob",
        params: { format }, // Send format as query parameter
        validateStatus: false,
      });

      if (response.status !== 200) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      const blob = new Blob([response.data], { type: `image/${format}` });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      // Remove existing extension and add new one
      const baseFileName = getFileNameWithoutExtension(originalName);
      const fileName = `${baseFileName}.${format}`;

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error("Download failed:", error);
      alert(`Failed to download file: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;

    setDownloading(true);
    try {
      const response = await axios({
        url: "http://localhost:5000/api/files/download-all",
        method: "POST",
        data: {
          fileIds: results.map((r) => r.fileId),
          format, // Send format to backend
        },
        responseType: "blob",
        headers: {
          Accept: "application/zip",
        },
      });

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `compressed-images-${format}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download all failed:", error);
      alert("Failed to download files. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    files.forEach(({ file }) => formData.append("images", file));
    formData.append("format", format);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/files/convert",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setProgress(progress);
          },
        }
      );

      setResults(response.data.processed);

      const originalSize = files.reduce(
        (acc, file) => acc + file.originalSize,
        0
      );
      const compressedSize = response.data.processed.reduce(
        (acc, file) => acc + file.size,
        0
      );
      setTotalSaved(originalSize - compressedSize);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to process images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const TopControls = () => (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
      <div className="flex gap-4 items-center w-full sm:w-auto">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="block w-32 p-2 bg-black text-white border border-white rounded focus:outline-none focus:border-gray-300"
        >
          <option value="webp">WebP</option>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
        </select>
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="flex-1 sm:flex-none bg-white text-black py-2 px-6 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? "Processing..." : "Compress Images"}
        </button>
      </div>

      {results.length > 0 && (
        <button
          onClick={handleDownloadAll}
          disabled={downloading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black py-2 px-6 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          {downloading ? "Creating ZIP..." : "Download All"}
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <TopControls />

      {uploading && (
        <div className="w-full bg-gray-800 rounded-full h-2.5 mb-6">
          <div
            className="bg-white h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6
          ${isDragActive ? "border-white bg-white/10" : "border-gray-600"}`}
      >
        <input {...getInputProps()} />
        <ArrowUpTrayIcon className="h-12 w-12 mx-auto text-white" />
        <p className="mt-2 text-white">
          Drag & drop images here, or click to select files
        </p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {files.map((file, index) => (
            <div
              key={index}
              className="border border-white rounded-lg overflow-hidden"
            >
              <img
                src={file.preview}
                alt={file.file.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-2 bg-black">
                <p className="truncate text-sm text-white">{file.file.name}</p>
                <p className="text-xs text-gray-400">
                  Size: {(file.originalSize / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Compressed Images
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((result) => (
              <div
                key={result.fileId}
                className="border border-white rounded-lg p-4"
              >
                <p className="truncate font-medium text-white">
                  {result.originalName}
                </p>
                <p className="text-sm text-gray-400 mb-2">
                  Size: {(result.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={() =>
                    handleDownload(result.fileId, result.originalName)
                  }
                  className="w-full bg-white text-black py-1.5 px-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download
                </button>
              </div>
            ))}
          </div>

          {totalSaved > 0 && (
            <div className="mt-4 p-4 border border-white rounded-lg">
              <p className="text-center text-white">
                Total size reduced: {(totalSaved / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;
