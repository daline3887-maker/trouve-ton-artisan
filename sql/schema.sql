CREATE DATABASE IF NOT EXISTS trouve_ton_artisan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE trouve_ton_artisan;
CREATE TABLE IF NOT EXISTS categories (id INT AUTO_INCREMENT PRIMARY KEY, nom VARCHAR(100) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS specialites (id INT AUTO_INCREMENT PRIMARY KEY, nom VARCHAR(120) NOT NULL UNIQUE, categorie_id INT NOT NULL, CONSTRAINT fk_specialite_categorie FOREIGN KEY (categorie_id) REFERENCES categories(id));
CREATE TABLE IF NOT EXISTS artisans (id INT AUTO_INCREMENT PRIMARY KEY, nom VARCHAR(160) NOT NULL, specialite_id INT NOT NULL, note DECIMAL(2,1) NOT NULL, ville VARCHAR(120) NOT NULL, a_propos TEXT NOT NULL, email VARCHAR(254) NOT NULL, site_web VARCHAR(500) NULL, top_artisan BOOLEAN NOT NULL DEFAULT FALSE, CONSTRAINT fk_artisan_specialite FOREIGN KEY (specialite_id) REFERENCES specialites(id), CONSTRAINT chk_note CHECK (note >= 0 AND note <= 5), INDEX idx_nom (nom), INDEX idx_specialite (specialite_id));
