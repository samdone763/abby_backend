/**
 * utils/seed.js
 * Creates the initial admin user in the database
 * Run once: node utils/seed.js
 */

require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const connectDB = require("../config/db");

const seed = async () => {
  await connectDB();

  console.log("\n🌱 Seeding admin user...\n");

  const existingAdmin = await Admin.findOne({ username: "abby_admin" });
  if (existingAdmin) {
    console.log("⚠️  Admin user 'abby_admin' already exists. Skipping seed.");
    console.log("   To reset password, delete the admin document from MongoDB and re-run.\n");
    await mongoose.disconnect();
    return;
  }

  const admin = await Admin.create({
    username: "abby_admin",
    password: process.env.ADMIN_DEFAULT_PASSWORD || "AbbyCakes2024!",
    role: "superadmin",
  });

  console.log("✅ Admin user created successfully!");
  console.log(`   Username: ${admin.username}`);
  console.log(`   Password: ${process.env.ADMIN_DEFAULT_PASSWORD || "AbbyCakes2024!"}`);
  console.log(`   Role: ${admin.role}`);
  console.log("\n⚠️  IMPORTANT: Change the password after first login!\n");

  await mongoose.disconnect();
  console.log("✅ Seeding complete. Database disconnected.");
  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
