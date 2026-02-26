/**
 * createAdmin.js
 * Run this ONCE to create the admin account
 * node createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const MONGO_URI = process.env.MONGO_URI;
const USERNAME = process.env.ADMIN_USERNAME || 'abby_admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'AbbyCakes2024x';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existing = await Admin.findOne({ username: USERNAME.toLowerCase() });
    if (existing) {
      console.log('⚠️ Admin already exists:', existing.username);
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin({
      username: USERNAME.toLowerCase(),
      password: PASSWORD,
      role: 'superadmin',
      isActive: true
    });

    await admin.save();
    console.log('🎉 Admin created successfully!');
    console.log('Username:', USERNAME);
    console.log('Password:', PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
