# Fast Images

A modern, efficient image compression web application built with React and Node.js. Fast Images allows users to compress and convert images while maintaining quality, offering flexibility and speed in handling various image formats.

## Features

- **Supports multiple image formats**: WebP, JPEG, PNG
- **Batch processing**: Configurable batch sizes for efficient handling
- **Adjustable compression quality**: Ranges from 1-100%
- **Individual and bulk downloads**: Download images individually or as a ZIP file
- **Automatic file cleanup**: Removes files after one hour to save space
- **LRU Cache implementation**: Ensures efficient memory usage
- **Real-time compression statistics**: Displays insights on compression
- **Already-optimized image detection**: Avoids re-processing optimized images
- **Drag-and-drop interface**: Easy-to-use interface for image uploads

## Tech Stack

### Frontend
- **React**
- **TailwindCSS**
- **Heroicons**
- **React-dropzone**
- **Axios**
- **React Hot Toast**

### Backend
- **Node.js**
- **Sharp**: For image processing
- **JSZip**: For packaging multiple images
- **UUID**: For unique file identification

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/fast-images.git
   cd fast-images
Install backend dependencies

bash
Copy code
cd backend
npm install
Install frontend dependencies

bash
Copy code
cd ../frontend
npm install
Configuration

Create a .env file in the backend directory with the following contents:
env
Copy code
PORT=5000
NODE_ENV=development
Usage
Start the backend server

bash
Copy code
cd backend
npm run dev
Start the frontend development server

bash
Copy code
cd ../frontend
npm start
Access the application at http://localhost:3000

API Endpoints
Convert Images
Endpoint: POST /api/files/convert
Body: FormData with images, format, and quality
Download Single Image
Endpoint: GET /api/files/download/:fileId
Returns: Processed image file
Download All Images
Endpoint: POST /api/files/download-all
Returns: ZIP file containing all processed images
Performance Features
Batch processing: Configurable sizes for efficient processing
LRU Cache: Ensures optimal memory management
Automatic cleanup: Old files are removed after one hour
Concurrent batch processing limits: Manages batch sizes for faster performance
Optimized image processing pipeline: Improves speed and reliability
Contributing
Fork the repository
Create your feature branch: git checkout -b feature/YourFeature
Commit your changes: git commit -m 'Add YourFeature'
Push to the branch: git push origin feature/YourFeature
Open a Pull Request
License
This project is licensed under the MIT License. See LICENSE for details.
