/**
 * routes/orders.js
 * Public order submission endpoint + order lookup
 */

const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const Order = require("../models/Order");
const { validateOrder } = require("../middleware/validate");
const { sendOrderNotification } = require("../utils/mailer");

// ─── POST /api/orders ──────────────────────────────────────────
// Submit a new customer order
router.post("/", validateOrder, async (req, res) => {
  try {
    const {
      customer,
      item,
      delivery,
      dateNeeded,
      notes,
    } = req.body;

    // Hash IP for spam tracking (privacy-safe)
    const rawIP = req.ip || req.connection.remoteAddress || "unknown";
    const ipHash = crypto.createHash("sha256").update(rawIP).digest("hex").slice(0, 16);

    // Create order in MongoDB
    const order = await Order.create({
      customer,
      item,
      delivery,
      dateNeeded,
      notes: notes || "",
      ipHash,
    });

    // Send email notification to bakery owner (non-blocking)
    try {
      await sendOrderNotification(order);
      order.emailSent = true;
      await order.save({ validateBeforeSave: false });
    } catch (emailErr) {
      // Don't fail the whole request if email fails
      console.error("⚠️  Email notification failed:", emailErr.message);
    }

    // Return success response (exclude sensitive ipHash)
    res.status(201).json({
      success: true,
      message: "🎂 Order received! We'll contact you to confirm.",
      order: {
        orderId: order.orderId,
        status: order.status,
        customer: order.customer,
        item: order.item,
        delivery: order.delivery,
        dateNeeded: order.dateNeeded,
        notes: order.notes,
        createdAt: order.createdAt,
      },
    });

  } catch (err) {
    // Handle MongoDB validation errors with friendly messages
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error.",
        errors: messages,
      });
    }
    console.error("❌ Order creation error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save order. Please try again or call us at 0620 767 919.",
    });
  }
});

// ─── GET /api/orders/:orderId ──────────────────────────────────
// Customer order status lookup by order ID (e.g. ORD-A1B2C3D4)
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Basic sanitize: only allow alphanumeric and dashes
    if (!/^ORD-[A-Z0-9]{8}$/.test(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format.",
      });
    }

    const order = await Order.findOne({ orderId }).select(
      "orderId status customer.name item delivery dateNeeded createdAt"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found. Please check your order ID.",
      });
    }

    res.json({
      success: true,
      order,
    });

  } catch (err) {
    console.error("❌ Order lookup error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
