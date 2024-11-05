import express from "express";
import { fileRouter } from "./routes/fileRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Test route
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is working!",
    environment: process.env.NODE_ENV,
    port: PORT,
  });
});

app.use("/api/files", fileRouter);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "frontend", "dist")));

// All other requests should serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

server.keepAliveTimeout = 120000; //
server.headersTimeout = 120000; //
