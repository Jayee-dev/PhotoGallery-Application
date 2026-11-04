
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const photoRoutes = require("./routes/photoRoutes");
const albumRoutes = require("./routes/albumRoutes");
const searchRoutes = require("./routes/searchRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Development CORS configuration
app.use(cors());

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API home
app.get("/", (req, res) => {
  res.json({
    message: "Photo Gallery API is running.",
    status: "ok",
  });
});

// Backend connection test
app.get("/api/health", (req, res) => {
  res.json({
    message: "Frontend and backend connection successful.",
    status: "ok",
  });
});

// MySQL connection test
app.get("/api/test-db", async (req, res) => {
  try {
    const db = require("./config/db");
    const [rows] = await db.query("SELECT 1 AS result");

    res.json({
      message: "MySQL connection successful.",
      data: rows[0],
    });
  } catch (error) {
    console.error("Database test failed:", error.message);

    res.status(500).json({
      message: "MySQL connection failed. Check server/.env.",
    });
  }
});

// Application routes
app.use("/api/auth", authRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// Unknown route
app.use((req, res) => {
  res.status(404).json({
    message: "API route not found.",
    path: req.originalUrl,
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Backend error:", error);

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "Image must be 5 MB or smaller.",
    });
  }

  return res.status(error.status || 500).json({
    message: error.message || "Unexpected server error.",
  });
});

// Start server
app.listen(PORT, "127.0.0.1", () => {
  console.log("================================");
  console.log("       PHOTO GALLERY API");
  console.log("================================");
  console.log(`Server: http://127.0.0.1:${PORT}`);
  console.log(`Health: http://127.0.0.1:${PORT}/api/health`);
  console.log("================================");
});
