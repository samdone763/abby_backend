/**
 * routes/admin.js
 * Admin authentication and protected order management routes
 */

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const Admin = require("../models/Admin");
const Order = require("../models/Order");
const { protect, generateToken } = require("../middleware/auth");
const { validateAdminLogin, validateStatusUpdate, validateObjectId } = require("../middleware/validate");

// ─── Strict rate limit for login attempts ─────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                    // Only 10 login attempts per window
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many login attempts. Please wait 15 minutes.",
  },
});

// ════════════════════════════════════════════
// PUBLIC ADMIN ROUTES (No auth required)
// ════════════════════════════════════════════

// ─── POST /api/admin/login ─────────────────────────────────────
router.post("/login", loginLimiter, validateAdminLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin (include password for comparison)
    const admin = await Admin.findOne({ username: username.toLowerCase() }).select("+password");

    if (!admin || !admin.isActive) {
      // Generic message prevents username enumeration
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // Record login timestamp
    await admin.recordLogin();

    // Generate JWT
    const token = generateToken(admin._id);

    res.json({
      success: true,
      message: "Login successful. Welcome back!",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

  } catch (err) {
    console.error("❌ Admin login error:", err);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// ─── GET /api/admin/verify ─────────────────────────────────────
// Verify if a JWT token is still valid
router.get("/verify", protect, (req, res) => {
  res.json({
    success: true,
    message: "Token is valid.",
    admin: {
      id: req.admin._id,
      username: req.admin.username,
      role: req.admin.role,
    },
  });
});

// ════════════════════════════════════════════
// PROTECTED ADMIN ROUTES (JWT required)
// ════════════════════════════════════════════

// ─── GET /api/admin/orders ─────────────────────────────────────
// Get all orders with filtering, sorting, and pagination
router.get("/orders", protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sort = "-createdAt",
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter = {};
    if (status && ["pending", "confirmed", "in-progress", "ready", "delivered", "cancelled"].includes(status)) {
      filter.status = status;
    }
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape regex
      filter.$or = [
        { orderId: { $regex: safeSearch, $options: "i" } },
        { "customer.name": { $regex: safeSearch, $options: "i" } },
        { "customer.phone": { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Validate sort field to prevent injection
    const allowedSorts = ["-createdAt", "createdAt", "-status", "status", "customer.name"];
    const safeSort = allowedSorts.includes(sort) ? sort : "-createdAt";

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(safeSort).skip(skip).limit(limitNum).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });

  } catch (err) {
    console.error("❌ Admin orders fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders." });
  }
});

// ─── GET /api/admin/stats ──────────────────────────────────────
// Dashboard statistics
router.get("/stats", protect, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      pendingOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      deliveryCount,
      pickupCount,
      statusBreakdown,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ "delivery.type": "delivery" }),
      Order.countDocuments({ "delivery.type": "pickup" }),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        todayOrders,
        weekOrders,
        monthOrders,
        deliveryCount,
        pickupCount,
        statusBreakdown: statusBreakdown.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
      },
    });

  } catch (err) {
    console.error("❌ Stats error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stats." });
  }
});

// ─── GET /api/admin/orders/:id ─────────────────────────────────
// Get single order by MongoDB ID
router.get("/orders/:id", protect, validateObjectId, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    res.json({ success: true, order });
  } catch (err) {
    console.error("❌ Order fetch error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── PATCH /api/admin/orders/:id/status ──────────────────────
// Update order status and admin notes
router.patch("/orders/:id/status", protect, validateObjectId, validateStatusUpdate, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(adminNotes !== undefined && { adminNotes }),
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    console.log(`✅ Order ${order.orderId} status updated to "${status}" by admin ${req.admin.username}`);

    res.json({
      success: true,
      message: `Order status updated to "${status}".`,
      order,
    });

  } catch (err) {
    console.error("❌ Order status update error:", err);
    res.status(500).json({ success: false, message: "Failed to update order." });
  }
});

// ─── DELETE /api/admin/orders/:id ─────────────────────────────
// Delete an order (superadmin only)
router.delete("/orders/:id", protect, validateObjectId, async (req, res) => {
  try {
    if (req.admin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only superadmins can delete orders.",
      });
    }

    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    console.log(`🗑️  Order ${order.orderId} deleted by superadmin ${req.admin.username}`);
    res.json({ success: true, message: "Order deleted successfully." });

  } catch (err) {
    console.error("❌ Order delete error:", err);
    res.status(500).json({ success: false, message: "Failed to delete order." });
  }
});

module.exports = router;
