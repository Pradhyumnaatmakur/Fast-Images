import express from "express";
import cors from "cors";
import { fileRouter } from "./routes/fileRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { configDotenv } from "dotenv";
import path from "path";

configDotenv();
const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS for your Vite frontend
app.use(
  cors({
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Accept"],
  })
);

// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up file size limits for uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API routes
app.use("/api/files", fileRouter);

// Error handling
app.use(errorHandler);

// Remove the Next.js specific code since you're using Vite
// Handle 404 for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
