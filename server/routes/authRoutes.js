const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: "Name, valid email and a password of at least 6 characters are required." });
    }

    const [existing] = await db.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length) {
      return res.status(409).json({ message: "This email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')",
      [name, email, passwordHash]
    );

    return res.status(201).json({ message: "Registration successful.", userId: result.insertId });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [rows] = await db.execute(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "development-only-change-this-secret",
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, email, phone, bio, role, created_at FROM users WHERE id = ? LIMIT 1",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found." });
    return res.json({ user: rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
