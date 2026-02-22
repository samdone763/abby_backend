/**
 * models/Order.js
 * Mongoose schema for customer cake orders
 */

const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const orderSchema = new mongoose.Schema(
  {
    // Auto-generated friendly order ID (e.g. ORD-A1B2C3D4)
    orderId: {
      type: String,
      unique: true,
      default: () => `ORD-${uuidv4().slice(0, 8).toUpperCase()}`,
    },

    // Customer details
    customer: {
      name: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters"],
        maxlength: [80, "Name too long"],
      },
      phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
        match: [/^[0-9+\-\s()]{7,20}$/, "Invalid phone number format"],
      },
    },

    // Order items
    item: {
      type: {
        type: String,
        required: [true, "Item type is required"],
        trim: true,
        maxlength: [100, "Item type too long"],
      },
      size: {
        type: String,
        trim: true,
        maxlength: [50, "Size too long"],
      },
      flavor: {
        type: String,
        trim: true,
        maxlength: [80, "Flavor too long"],
      },
      quantity: {
        type: String,
        required: [true, "Quantity is required"],
        trim: true,
      },
    },

    // Delivery details
    delivery: {
      type: {
        type: String,
        enum: ["pickup", "delivery"],
        required: [true, "Delivery type is required"],
        lowercase: true,
      },
      address: {
        type: String,
        trim: true,
        maxlength: [300, "Address too long"],
      },
    },

    // When is the order needed?
    dateNeeded: {
      type: String,
      required: [true, "Date needed is required"],
      trim: true,
    },

    // Additional notes from customer
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes too long"],
      default: "",
    },

    // Order management
    status: {
      type: String,
      enum: ["pending", "confirmed", "in-progress", "ready", "delivered", "cancelled"],
      default: "pending",
    },

    // Admin notes
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Admin notes too long"],
      default: "",
    },

    // Email notification tracking
    emailSent: {
      type: Boolean,
      default: false,
    },

    // IP for spam prevention (hashed/truncated for privacy)
    ipHash: {
      type: String,
      select: false, // Don't include in queries by default
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false,
  }
);

// Index for faster queries
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ "customer.phone": 1 });

// Virtual for formatted date
orderSchema.virtual("createdAtFormatted").get(function () {
  return this.createdAt.toLocaleString("en-TZ", {
    timeZone: "Africa/Dar_es_Salaam",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Method: Get summary string
orderSchema.methods.getSummary = function () {
  return `${this.item.quantity}x ${this.item.type} (${this.item.flavor}, ${this.item.size}) — ${this.delivery.type}`;
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
