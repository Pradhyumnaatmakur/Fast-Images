import React from "react";

const ImagePreview = ({ file }) => {
  return (
    <div className="relative border border-white rounded-lg overflow-hidden bg-black">
      <img
        src={file.preview}
        alt={file.file.name}
        className="w-full h-40 object-cover"
      />
      <div className="p-2 bg-black text-white font-mono">
        <p className="text-sm truncate">{file.file.name}</p>
        <p className="text-xs text-gray-400">
          Size: {(file.originalSize / 1024).toFixed(2)} KB
        </p>
      </div>
    </div>
  );
};

export default ImagePreview;
