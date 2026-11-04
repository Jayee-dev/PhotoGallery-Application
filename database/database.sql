CREATE DATABASE IF NOT EXISTS photo_gallery_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE photo_gallery_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  bio VARCHAR(500) NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS albums (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_albums_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_albums_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  album_id INT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NULL,
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500) NOT NULL,
  tags VARCHAR(500) NULL,
  upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_photos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_photos_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL,
  INDEX idx_photos_user (user_id),
  INDEX idx_photos_album (album_id),
  INDEX idx_photos_upload_date (upload_date),
  FULLTEXT INDEX ft_photos_title_description (title, description)
) ENGINE=InnoDB;

-- After registering your account, an administrator can grant admin access with:
-- UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
