/**
 * middleware/validate.js
 * Input validation and sanitization rules using express-validator
 */

const { body, param, validationResult } = require("express-validator");

// ─── Helper: Run validation and return errors ─────────────────
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed. Please check your input.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Order Validation Rules ───────────────────────────────────
const validateOrder = [
  body("customer.name")
    .trim()
    .notEmpty().withMessage("Customer name is required")
    .isLength({ min: 2, max: 80 }).withMessage("Name must be 2–80 characters")
    .escape(), // Sanitize HTML

  body("customer.phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .matches(/^[0-9+\-\s()]{7,20}$/).withMessage("Invalid phone number"),

  body("item.type")
    .trim()
    .notEmpty().withMessage("Item type is required")
    .isLength({ max: 100 }).withMessage("Item type too long")
    .escape(),

  body("item.flavor")
    .optional()
    .trim()
    .isLength({ max: 80 }).withMessage("Flavor too long")
    .escape(),

  body("item.size")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Size too long")
    .escape(),

  body("item.quantity")
    .trim()
    .notEmpty().withMessage("Quantity is required")
    .escape(),

  body("delivery.type")
    .trim()
    .notEmpty().withMessage("Delivery type is required")
    .isIn(["pickup", "delivery"]).withMessage("Delivery type must be 'pickup' or 'delivery'"),

  body("delivery.address")
    .if(body("delivery.type").equals("delivery"))
    .trim()
    .notEmpty().withMessage("Delivery address is required when choosing delivery")
    .isLength({ max: 300 }).withMessage("Address too long")
    .escape(),

  body("dateNeeded")
    .trim()
    .notEmpty().withMessage("Date needed is required")
    .isLength({ max: 100 }).withMessage("Date field too long")
    .escape(),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Notes too long")
    .escape(),

  handleValidation,
];

// ─── Admin Login Validation ───────────────────────────────────
const validateAdminLogin = [
  body("username")
    .trim()
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 2, max: 30 }).withMessage("Invalid username")
    .escape(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6, max: 128 }).withMessage("Invalid password"),

  handleValidation,
];

// ─── Order Status Update Validation ──────────────────────────
const validateStatusUpdate = [
  body("status")
    .trim()
    .notEmpty().withMessage("Status is required")
    .isIn(["pending", "confirmed", "in-progress", "ready", "delivered", "cancelled"])
    .withMessage("Invalid status value"),

  body("adminNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Admin notes too long")
    .escape(),

  handleValidation,
];

// ─── MongoDB ObjectId Validation ──────────────────────────────
const validateObjectId = [
  param("id")
    .isMongoId().withMessage("Invalid ID format"),
  handleValidation,
];

module.exports = {
  validateOrder,
  validateAdminLogin,
  validateStatusUpdate,
  validateObjectId,
};
