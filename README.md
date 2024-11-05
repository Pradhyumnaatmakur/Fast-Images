# Fast Images

A modern, efficient image compression web application built with React and Node.js that enables users to compress and convert images while maintaining quality.

## Features

* Supports multiple image formats (WebP, JPEG, PNG)
* Batch processing with configurable batch sizes
* Adjustable compression quality (1-100%)
* Individual and bulk downloads
* Automatic file cleanup after one hour
* LRU Cache implementation
* Real-time compression statistics
* Already-optimized image detection
* Drag-and-drop interface

## Tech Stack

### Frontend
* React
* TailwindCSS
* Heroicons
* React-dropzone
* Axios
* React Hot Toast

### Backend
* Node.js
* Sharp
* JSZip
* UUID

## Installation

1. Clone the repository
   ```bash
Install backend dependencies
bashCopycd backend
npm install

Install frontend dependencies
bashCopycd ../frontend
npm install


Configuration
Create a .env file in the backend directory:
envCopyPORT=5000
NODE_ENV=development
Usage

Start the backend server:
bashCopycd backend
npm run dev

Start the frontend development server:
bashCopycd frontend
npm start

Access the application at http://localhost:3000

API Endpoints
Convert Images

POST /api/files/convert
Body: FormData with images, format, and quality

Download Single Image

GET /api/files/download/:fileId
Returns: Processed image file

Download All Images

POST /api/files/download-all
Returns: ZIP file containing all processed images

Performance Features

Batch processing with configurable sizes
LRU Cache for efficient memory usage
Automatic cleanup of old files
Concurrent batch processing limits
Optimized image processing pipeline

Contributing

Fork the repository
Create your feature branch (git checkout -b feature/YourFeature)
Commit your changes (git commit -m 'Add YourFeature')
Push to the branch (git push origin feature/YourFeature)
Open a Pull Request

License
This project is licensed under the MIT License. See LICENSE for details.
