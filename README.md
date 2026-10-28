# Trouve ton artisan ! — Projet CEF

Plateforme de recherche des artisans d’Auvergne-Rhône-Alpes.

## Prérequis
Node.js 20+, npm, MySQL 8+ (ou MariaDB récent), un serveur SMTP pour le formulaire de contact.

## Installation locale
1. Exécuter `sql/schema.sql`, puis `sql/seed.sql` dans MySQL (dans cet ordre).
2. `cd backend && npm install` ; copier `.env.example` vers `.env` et compléter les paramètres MySQL et SMTP ; `npm run dev`.
3. Dans un second terminal : `cd frontend && npm install && npm run dev`.
4. Ouvrir `http://localhost:5173`.

## Fonctionnalités
Accueil, artisans du mois, catégories, recherche par nom, fiches artisan, formulaire d'envoi par SMTP, page 404, pages légales temporaires.

## API
- `GET /api/health`
- `GET /api/categories`
- `GET /api/artisans?categorie=Services&search=nom&top=1`
- `GET /api/artisans/:id`
- `POST /api/artisans/:id/contact` : JSON `{nom,email,objet,message}`.

## Mise en ligne
Héberger le frontend statique (commande `npm run build`, répertoire `dist`), le backend sur un serveur Node.js avec HTTPS et MySQL hébergé. Configurer `VITE_API_URL`, `FRONTEND_ORIGIN` et les variables SMTP côté serveur. Ne jamais exposer les identifiants MySQL dans le frontend.

## Points restant à finaliser
- Maquettes et lien Figma créés sur un compte Figma.
- Hébergement public, URL, dépôt GitHub et tests en production.
- Mentions légales, données personnelles, cookies et déclaration d'accessibilité à valider par la collectivité.
- Licence Graphik à obtenir et police à intégrer après vérification des droits ; police de remplacement utilisée provisoirement.
- Test d'envoi réel avec un compte SMTP et validation des adresses du jeu de test.

## Sécurité
Requêtes MySQL paramétrées, limitation de débit, validation des entrées, Helmet, CORS restreint, variables secrètes côté serveur. HTTPS, suivi des dépendances, contrôle de l'expéditeur SMTP et protections anti-abus à vérifier en production.
