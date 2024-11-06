# Fast Images

A modern, efficient image compression web application built with React and Node.js that allows users to compress and convert images to different formats while maintaining quality.

## Features

- 🖼️ Support for multiple image formats (WebP, JPEG, PNG)
- 📦 Batch processing with progress tracking
- 🎚️ Adjustable compression quality
- 💾 Individual and bulk downloads
- ⚡ Efficient caching mechanism
- 📊 Real-time compression statistics
- 🎯 Automatic optimization detection

## Technologies Used

- Frontend:
  - React
  - Tailwind CSS
  - Axios
  - React Dropzone
  - Hero Icons
  - React Hot Toast

- Backend:
  - Node.js
  - Sharp (for image processing)
  - UUID
  - JSZip

## Key Features

### Batch Processing
- Images are processed in batches of 5
- Concurrent processing is limited to maintaining performance
- Progress tracking for each file

### Caching System
- LRU (Least Recently Used) cache implementation
- Automatically cleans up processed files after 1 hour
- Efficient memory management

### Optimization Detection
- Automatically detects if images are already optimized
- Prevents unnecessary compression
- Provides user feedback for optimized files

## API Endpoints

### POST `/api/files/convert`
Convert and compress uploaded images
- Body: FormData with images, format, and quality
- Returns: Processed file information

### GET `/api/files/download/:fileId`
Download a single processed file
- Params: fileId
- Returns: Processed image file

### POST `/api/files/download-all`
Download multiple files as ZIP
- Body: Array of fileIds
- Returns: ZIP file containing all processed images

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) for the excellent image processing library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [React Dropzone](https://react-dropzone.js.org/) for the file upload functionality
