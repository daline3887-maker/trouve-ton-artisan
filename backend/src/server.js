
require('dotenv').config();

const fs = require('node:fs');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();

// ==========================================
// 1. CONFIGURATION ET SECURITE
// ==========================================

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '20kb' }));

const allowed = (
  process.env.FRONTEND_ORIGIN ||
  'http://localhost:5173,http://localhost:5174'
)
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowed.includes(origin));
  }
}));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

// ==========================================
// 2. CONNEXION MYSQL / AIVEN
// ==========================================

const dbHost = process.env.DB_HOST || '127.0.0.1';

const isLocalDatabase = [
  'localhost',
  '127.0.0.1',
  '::1'
].includes(dbHost);

const sslConfig = isLocalDatabase
  ? undefined
  : {
      rejectUnauthorized: true,
      ...(process.env.DB_SSL_CA
        ? {
            ca: fs.readFileSync(
              process.env.DB_SSL_CA,
              'utf8'
            )
          }
        : {})
    };

const pool = mysql.createPool({
  host: dbHost,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trouve_ton_artisan',
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 15000
});

// ==========================================
// 3. REQUETE SQL COMMUNE
// ==========================================

const SELECT = `
  SELECT
    a.id,
    a.nom,
    a.note,
    a.ville,
    a.a_propos,
    a.site_web,
    a.top_artisan,
    s.nom AS specialite,
    c.nom AS categorie
  FROM artisans a
  JOIN specialites s
    ON s.id = a.specialite_id
  JOIN categories c
    ON c.id = s.categorie_id
`;

// ==========================================
// 4. VERIFICATION DE L'API
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ==========================================
// 5. LISTE DES CATEGORIES
// ==========================================

app.get('/api/categories', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nom FROM categories ORDER BY nom'
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 6. LISTE ET RECHERCHE DES ARTISANS
// ==========================================

app.get('/api/artisans', async (req, res, next) => {
  try {
    const clauses = [];
    const values = [];

    if (req.query.categorie) {
      clauses.push('c.nom = ?');
      values.push(
        String(req.query.categorie).slice(0, 100)
      );
    }

    if (req.query.search) {
      const search = String(req.query.search)
        .slice(0, 120)
        .replace(/[\\%_]/g, '\\$&');

      clauses.push('a.nom LIKE ?');
      values.push('%' + search + '%');
    }

    if (req.query.top === '1') {
      clauses.push('a.top_artisan = 1');
    }

    const where = clauses.length
      ? ' WHERE ' + clauses.join(' AND ')
      : '';

    const sql = SELECT + where +
      ' ORDER BY a.note DESC, a.nom ASC LIMIT 100';

    const [rows] = await pool.query(sql, values);

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 7. FICHE D'UN ARTISAN
// ==========================================

app.get('/api/artisans/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(404).json({
        error: 'Artisan introuvable'
      });
    }

    const [rows] = await pool.query(
      SELECT + ' WHERE a.id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: 'Artisan introuvable'
      });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 8. FORMULAIRE DE CONTACT
// ==========================================

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

app.post(
  '/api/artisans/:id/contact',
  contactLimiter,
  async (req, res, next) => {
    try {
      const { nom, email, objet, message } = req.body || {};

      const validId = /^\d+$/.test(req.params.id);

      const validNom =
        typeof nom === 'string' &&
        nom.trim().length > 0 &&
        nom.length <= 120;

      const validEmail =
        typeof email === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
        email.length <= 254;

      const validObjet =
        typeof objet === 'string' &&
        objet.trim().length > 0 &&
        objet.length <= 150;

      const validMessage =
        typeof message === 'string' &&
        message.trim().length >= 10 &&
        message.length <= 3000;

      if (
        !validId ||
        !validNom ||
        !validEmail ||
        !validObjet ||
        !validMessage
      ) {
        return res.status(400).json({
          error: 'Champs invalides'
        });
      }

      const [rows] = await pool.query(
        'SELECT email FROM artisans WHERE id = ?',
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({
          error: 'Artisan introuvable'
        });
      }

      if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS ||
        !process.env.MAIL_FROM
      ) {
        return res.status(503).json({
          error: 'Service de contact non configure'
        });
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: rows[0].email,
        replyTo: email,
        subject: 'Contact artisan : ' +
          objet.replace(/[\r\n]/g, ' '),
        text: `Nom : ${nom}
Email : ${email}

${message}`
      });

      res.json({ ok: true });

    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// 9. GESTION DES ERREURS
// ==========================================

app.use((error, req, res, next) => {
  console.error('Erreur API :', error);

  res.status(500).json({
    error: 'Erreur interne du serveur'
  });
});

// ==========================================
// 10. DEMARRAGE DU SERVEUR
// ==========================================

const PORT = Number(process.env.PORT || 3001);

app.listen(PORT, () => {
  console.log(`API demarree sur le port ${PORT}`);
});

// ==========================================
// 11. TEST DE CONNEXION MYSQL
// ==========================================

async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();

    console.log('Connexion MySQL reussie');

    connection.release();
  } catch (error) {
    console.error('Connexion MySQL impossible');
    console.error('Code :', error.code);
    console.error('Message :', error.message);
  }
}

testDatabaseConnection();
