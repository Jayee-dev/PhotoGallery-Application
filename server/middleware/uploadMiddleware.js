const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, extension)
      .replace(/[^a-z0-9_-]/gi, "-")
      .slice(0, 40) || "photo";
    callback(null, `${Date.now()}-${safeBase}${extension}`);
  },
});

function fileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension)) {
    return callback(null, true);
  }
  return callback(new Error("Only JPG, JPEG, PNG, GIF and WEBP images are allowed."));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

module.exports = upload;
