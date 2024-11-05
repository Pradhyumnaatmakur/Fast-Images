import express from "express";
import cors from "cors";
import { fileRouter } from "./routes/fileRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { configDotenv } from "dotenv";
import path from "path";

configDotenv();
const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// Updated CORS configuration to allow both development and production URLs
const allowedOrigins = [
  "http://localhost:5173",
  "https://fast-images.onrender.com",
  // Add any other domains you need to allow
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Accept"],
    credentials: true, // Enable credentials if you need to send cookies
  })
);

// Body parser middleware - consolidated configuration
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API routes
app.use("/api/files", fileRouter);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
