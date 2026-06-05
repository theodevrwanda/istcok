const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../Config/Connection");
const authMiddleware = require("../Middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "stockmanagementsystem_secret_key_2026";

// 1. Register User
router.post("/register", async (req, res) => {
  const { user_name, password } = req.body;

  if (!user_name || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    // Check if user already exists
    const [existing] = await db.query("SELECT * FROM Users WHERE user_name = ?", [user_name]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      "INSERT INTO Users (user_name, password) VALUES (?, ?)",
      [user_name, hashedPassword]
    );

    return res.status(201).json({
      message: "User registered successfully.",
      user_id: result.insertId,
      user_name
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Database error during registration." });
  }
});

// 2. Login User
router.post("/login", async (req, res) => {
  const { user_name, password } = req.body;

  if (!user_name || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    // Find user
    const [users] = await db.query("SELECT * FROM Users WHERE user_name = ?", [user_name]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const user = users[0];

    // Check password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    // Sign JWT
    const token = jwt.sign(
      { user_id: user.user_id, user_name: user.user_name },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        user_id: user.user_id,
        user_name: user.user_name
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Database error during login." });
  }
});

// 3. Get Current User Info
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query("SELECT user_id, user_name FROM Users WHERE user_id = ?", [req.user.user_id]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json(users[0]);
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Database error." });
  }
});

// 4. Verify Username exists (for password reset)
router.post("/verify-username", async (req, res) => {
  const { user_name } = req.body;

  if (!user_name) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    const [users] = await db.query("SELECT user_id FROM Users WHERE user_name = ?", [user_name.trim()]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Username does not exist." });
    }
    return res.json({ message: "Username verified.", exists: true });
  } catch (error) {
    console.error("Verify username error:", error);
    return res.status(500).json({ message: "Database error during username verification." });
  }
});

// 5. Reset Password (for password reset after validation)
router.post("/reset-password", async (req, res) => {
  const { user_name, password } = req.body;

  if (!user_name || !password) {
    return res.status(400).json({ message: "Username and new password are required." });
  }

  try {
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password in DB
    const [result] = await db.query("UPDATE Users SET password = ? WHERE user_name = ?", [hashedPassword, user_name.trim()]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found or password not updated." });
    }

    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Database error during password reset." });
  }
});

module.exports = router;
