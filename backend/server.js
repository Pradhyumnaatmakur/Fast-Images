import express from "express";
import cors from "cors";
import { fileRouter } from "./routes/fileRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { configDotenv } from "dotenv";
import path from "path";

configDotenv();
const app = express();
const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";
const __dirname = path.resolve();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:10000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:10000",
  "https://fast-images.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (process.env.NODE_ENV === "development") {
        return callback(null, true);
      }
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
    credentials: true,
  })
);

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

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

app.use(errorHandler);

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

server.keepAliveTimeout = 120000; //
server.headersTimeout = 120000; //
