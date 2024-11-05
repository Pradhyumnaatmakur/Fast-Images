import express from "express";
import cors from "cors";
import { fileRouter } from "./routes/fileRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { configDotenv } from "dotenv";
import path from "path";

configDotenv();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Accept"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/files", fileRouter);

app.use(errorHandler);

app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
