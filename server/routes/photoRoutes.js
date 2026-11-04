const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const db = require("../config/db");
const upload = require("../middleware/uploadMiddleware");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();
const uploadsDirectory = path.join(__dirname, "..", "uploads");

router.post("/upload", authenticateToken, upload.single("photo"), async (req, res, next) => {
  let savedPath = null;
  try {
    if (!req.file) return res.status(400).json({ message: "Please choose an image file." });
    savedPath = req.file.path;

    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const tags = String(req.body.tags || "").trim();
    const albumId = req.body.album_id ? Number(req.body.album_id) : null;

    if (!title) {
      await fs.unlink(savedPath).catch(() => {});
      return res.status(400).json({ message: "Photo title is required." });
    }

    const relativePath = `/uploads/${req.file.filename}`;
    const [result] = await db.execute(
      `INSERT INTO photos (user_id, album_id, title, description, filename, filepath, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, albumId, title, description, req.file.filename, relativePath, tags]
    );

    return res.status(201).json({
      message: "Photo uploaded successfully.",
      photo: {
        id: result.insertId,
        user_id: req.user.id,
        album_id: albumId,
        title,
        description,
        filename: req.file.filename,
        filepath: relativePath,
        tags,
      },
    });
  } catch (error) {
    if (savedPath) await fs.unlink(savedPath).catch(() => {});
    return next(error);
  }
});

router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.id, p.user_id, p.album_id, p.title, p.description, p.filename,
              p.filepath, p.tags, p.upload_date, a.title AS album_title
       FROM photos p LEFT JOIN albums a ON a.id = p.album_id
       WHERE p.user_id = ? ORDER BY p.upload_date DESC`,
      [req.user.id]
    );
    return res.json({ photos: rows });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM photos WHERE id = ? AND user_id = ? LIMIT 1",
      [Number(req.params.id), req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Photo not found." });
    return res.json({ photo: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", authenticateToken, async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const tags = String(req.body.tags || "").trim();
    const albumId = req.body.album_id ? Number(req.body.album_id) : null;
    if (!title) return res.status(400).json({ message: "Photo title is required." });

    const [result] = await db.execute(
      `UPDATE photos SET title = ?, description = ?, tags = ?, album_id = ?
       WHERE id = ? AND user_id = ?`,
      [title, description, tags, albumId, Number(req.params.id), req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Photo not found." });
    return res.json({ message: "Photo details updated." });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      "SELECT filename FROM photos WHERE id = ? AND user_id = ? LIMIT 1",
      [Number(req.params.id), req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Photo not found." });

    await db.execute("DELETE FROM photos WHERE id = ? AND user_id = ?", [Number(req.params.id), req.user.id]);
    const filename = path.basename(rows[0].filename);
    await fs.unlink(path.join(uploadsDirectory, filename)).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    return res.json({ message: "Photo deleted." });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
