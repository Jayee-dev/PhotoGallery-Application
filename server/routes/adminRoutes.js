
const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const db = require("../config/db");
const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();
const uploadsDirectory = path.join(__dirname, "..", "uploads");

// Every route in this file requires administrator access.
router.use(authenticateToken, requireAdmin);

// Dashboard summary
router.get("/summary", async (req, res, next) => {
  try {
    const [[users]] = await db.query(
      "SELECT COUNT(*) AS total FROM users"
    );

    const [[albums]] = await db.query(
      "SELECT COUNT(*) AS total FROM albums"
    );

    const [[photos]] = await db.query(
      "SELECT COUNT(*) AS total FROM photos"
    );

    res.json({
      users: Number(users.total),
      albums: Number(albums.total),
      photos: Number(photos.total),
    });
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get("/users", async (req, res, next) => {
  try {
    const [users] = await db.query(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Delete a user and their associated uploaded files
router.delete("/users/:id", async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (userId === Number(req.user.id)) {
      return res.status(400).json({
        message: "You cannot delete your own administrator account.",
      });
    }

    const [photos] = await db.execute(
      "SELECT filename FROM photos WHERE user_id = ?",
      [userId]
    );

    const [result] = await db.execute(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "User not found." });
    }

    for (const photo of photos) {
      const filename = path.basename(photo.filename);

      await fs.unlink(
        path.join(uploadsDirectory, filename)
      ).catch((error) => {
        if (error.code !== "ENOENT") {
          console.error("Could not remove uploaded file:", error.message);
        }
      });
    }

    res.json({ message: "User deleted successfully." });
  } catch (error) {
    next(error);
  }
});

// Get all albums
router.get("/albums", async (req, res, next) => {
  try {
    const [albums] = await db.query(`
      SELECT
        a.id,
        a.user_id,
        a.title,
        a.description,
        a.created_at,
        u.name AS creator,
        u.email AS creator_email,
        COUNT(p.id) AS photo_count
      FROM albums a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN photos p ON p.album_id = a.id
      GROUP BY
        a.id, a.user_id, a.title, a.description,
        a.created_at, u.name, u.email
      ORDER BY a.created_at DESC
    `);

    res.json({ albums });
  } catch (error) {
    next(error);
  }
});

// Delete any album as administrator.
// Its photos remain in the gallery without an album.
router.delete("/albums/:id", async (req, res, next) => {
  try {
    const albumId = Number(req.params.id);

    if (!Number.isInteger(albumId) || albumId <= 0) {
      return res.status(400).json({ message: "Invalid album ID." });
    }

    const [result] = await db.execute(
      "DELETE FROM albums WHERE id = ?",
      [albumId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Album not found." });
    }

    res.json({
      message: "Album deleted. Its photos remain in the gallery.",
    });
  } catch (error) {
    next(error);
  }
});

// Get all uploaded photos
router.get("/photos", async (req, res, next) => {
  try {
    const [photos] = await db.query(`
      SELECT
        p.id,
        p.user_id,
        p.album_id,
        p.title,
        p.description,
        p.filename,
        p.filepath,
        p.tags,
        p.upload_date,
        u.name AS uploaded_by,
        u.email AS uploader_email,
        a.title AS album_title
      FROM photos p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN albums a ON a.id = p.album_id
      ORDER BY p.upload_date DESC
    `);

    res.json({ photos });
  } catch (error) {
    next(error);
  }
});

// Delete any photo as administrator
router.delete("/photos/:id", async (req, res, next) => {
  try {
    const photoId = Number(req.params.id);

    if (!Number.isInteger(photoId) || photoId <= 0) {
      return res.status(400).json({ message: "Invalid photo ID." });
    }

    const [rows] = await db.execute(
      "SELECT filename FROM photos WHERE id = ? LIMIT 1",
      [photoId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Photo not found." });
    }

    await db.execute(
      "DELETE FROM photos WHERE id = ?",
      [photoId]
    );

    const filename = path.basename(rows[0].filename);

    await fs.unlink(
      path.join(uploadsDirectory, filename)
    ).catch((error) => {
      if (error.code !== "ENOENT") {
        console.error("Could not remove photo file:", error.message);
      }
    });

    res.json({ message: "Photo deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
