/**
 * ═══════════════════════════════════════════════════════════════
 *  ABBY CAKE AND BITES — Production Backend Server
 *  Author: AI Architect
 *  Stack: Node.js + Express + MongoDB + Nodemailer + JWT
 * ═══════════════════════════════════════════════════════════════
 */

require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const chatRoutes = require("./routes/chat");
const galleryRoutes = require("./routes/gallery");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Connect to MongoDB ───────────────────────────────────────
connectDB();

// ─── Security Middleware ──────────────────────────────────────
app.use(helmet()); // Sets secure HTTP headers
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: "20mb" })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ─── Global Rate Limiting ─────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // limit each IP to 100 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use(globalLimiter);

// ─── Stricter Limiter for Orders ──────────────────────────────
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                   // max 10 orders per hour per IP
  message: { success: false, message: "Too many order submissions. Please wait and try again." },
});

// ─── Health Check ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎂 Abby Cake and Bites API is live!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── Routes ───────────────────────────────────────────────────
app.use("/api/orders", orderLimiter, orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/setup", require("./routes/setup"));
// ─── 404 Handler ─────────────────────────────────────────────
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎂 Abby Cake & Bites Backend`);
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 API: http://localhost:${PORT}/api\n`);
});

module.exports = app;
