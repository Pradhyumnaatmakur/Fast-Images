# Fast Images

A modern, efficient image compression web application built with React and Node.js that allows users to compress and convert images to different formats while maintaining quality.

![Image Compressor Demo](https://github.com/yourusername/image-compressor/raw/main/demo.gif)

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

## Installation

1. Clone the repository:
```bash 
git clone https://github.com/Pradhyumnaatmakur/fast-images
cd image-compressor
```

2. Install dependencies for both frontend and backend:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Start the development servers:
```bash
# Start backend server (from server directory)
npm start

# Start frontend development server (from client directory)
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. Drag and drop images or click to select files
2. Choose the desired output format (WebP, JPEG, or PNG)
3. Adjust the quality slider (1-100)
4. Click "Compress Images" to start processing
5. Download individual images or use "Download All as ZIP"

## Key Features Explained

### Batch Processing
- Images are processed in batches of 5
- Concurrent processing is limited to maintain performance
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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) for the excellent image processing library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [React Dropzone](https://react-dropzone.js.org/) for the file upload functionality

## Support

For support, please open an issue in the GitHub repository or contact [your-email@example.com](mailto:your-email@example.com)
