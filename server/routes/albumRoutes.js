const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT a.id, a.user_id, a.title, a.description, a.created_at,
              COUNT(p.id) AS photo_count
       FROM albums a LEFT JOIN photos p ON p.album_id = a.id
       WHERE a.user_id = ? GROUP BY a.id ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    return res.json({ albums: rows });
  } catch (error) { return next(error); }
});

router.post("/", authenticateToken, async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    if (!title) return res.status(400).json({ message: "Album title is required." });
    const [result] = await db.execute(
      "INSERT INTO albums (user_id, title, description) VALUES (?, ?, ?)",
      [req.user.id, title, description]
    );
    return res.status(201).json({ message: "Album created.", albumId: result.insertId });
  } catch (error) { return next(error); }
});

router.put("/:id", authenticateToken, async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    if (!title) return res.status(400).json({ message: "Album title is required." });
    const [result] = await db.execute(
      "UPDATE albums SET title = ?, description = ? WHERE id = ? AND user_id = ?",
      [title, description, Number(req.params.id), req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Album not found." });
    return res.json({ message: "Album updated." });
  } catch (error) { return next(error); }
});

router.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM albums WHERE id = ? AND user_id = ?",
      [Number(req.params.id), req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Album not found." });
    await db.execute("UPDATE photos SET album_id = NULL WHERE album_id = ? AND user_id = ?", [Number(req.params.id), req.user.id]);
    return res.json({ message: "Album deleted. Photos remain in your gallery." });
  } catch (error) { return next(error); }
});

module.exports = router;
