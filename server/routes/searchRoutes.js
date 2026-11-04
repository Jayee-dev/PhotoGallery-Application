const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Converted from the team's Flask search module to Express + MySQL.
// Supported modes: name, tag and date.
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const mode = String(req.query.mode || "name");
    const query = String(req.query.q || "").trim();
    const dateFrom = String(req.query.date_from || "");
    const dateTo = String(req.query.date_to || "");

    const conditions = ["p.user_id = ?"];
    const params = [req.user.id];

    if (mode === "name") {
      if (query) {
        conditions.push("p.title LIKE ?");
        params.push(`%${query}%`);
      }
    } else if (mode === "tag") {
      const tags = query.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
      for (const tag of tags) {
        conditions.push("CONCAT(',', LOWER(REPLACE(COALESCE(p.tags, ''), ' ', '')), ',') LIKE ?");
        params.push(`%,${tag},%`);
      }
      if (!tags.length) return res.json({ photos: [] });
    } else if (mode === "date") {
      if (dateFrom) { conditions.push("DATE(p.upload_date) >= ?"); params.push(dateFrom); }
      if (dateTo) { conditions.push("DATE(p.upload_date) <= ?"); params.push(dateTo); }
      if (!dateFrom && !dateTo) return res.status(400).json({ message: "Provide a start date or end date." });
    } else {
      return res.status(400).json({ message: "Search mode must be name, tag or date." });
    }

    const [rows] = await db.execute(
      `SELECT p.id, p.title, p.description, p.filename, p.filepath,
              p.tags, p.upload_date, p.album_id, a.title AS album_title
       FROM photos p LEFT JOIN albums a ON a.id = p.album_id
       WHERE ${conditions.join(" AND ")} ORDER BY p.upload_date DESC`,
      params
    );
    return res.json({ photos: rows, count: rows.length, mode });
  } catch (error) { return next(error); }
});

module.exports = router;
