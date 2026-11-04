const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.put("/profile", authenticateToken, async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const bio = String(req.body.bio || "").trim();
    if (!name || !email) return res.status(400).json({ message: "Name and email are required." });

    const [existing] = await db.execute("SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1", [email, req.user.id]);
    if (existing.length) return res.status(409).json({ message: "This email is already in use." });

    await db.execute(
      "UPDATE users SET name = ?, email = ?, phone = ?, bio = ? WHERE id = ?",
      [name, email, phone || null, bio || null, req.user.id]
    );
    return res.json({ message: "Profile updated successfully." });
  } catch (error) { return next(error); }
});

module.exports = router;
