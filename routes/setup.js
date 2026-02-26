/**
 * routes/setup.js
 * One-time admin setup endpoint
 * DELETE THIS FILE after admin is created!
 */

const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

router.get("/create-admin", async (req, res) => {
  try {
    // Security check - require secret key
    const secret = req.query.secret;
    if (secret !== "abby-setup-2024") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const USERNAME = process.env.ADMIN_USERNAME || "abby_admin";
    const PASSWORD = process.env.ADMIN_PASSWORD || "AbbyCakes2024x";

    // Check if admin already exists
    const existing = await Admin.findOne({ username: USERNAME.toLowerCase() });
    if (existing) {
      return res.json({ 
        success: true, 
        message: "Admin already exists!",
        username: existing.username 
      });
    }

    // Create admin
    const admin = new Admin({
      username: USERNAME.toLowerCase(),
      password: PASSWORD,
      role: "superadmin",
      isActive: true
    });

    await admin.save();

    res.json({
      success: true,
      message: "✅ Admin created successfully! Delete setup.js now.",
      username: USERNAME
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
