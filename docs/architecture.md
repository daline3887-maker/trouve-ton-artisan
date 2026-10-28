# Modèle conceptuel et logique

## MCD (cardinalités)
- CATÉGORIE (1,N) — regroupe — (1,1) SPÉCIALITÉ
- SPÉCIALITÉ (0,N) — est exercée par — (1,1) ARTISAN

## MLD
- CATEGORIES(**id**, nom UNIQUE)
- SPECIALITES(**id**, nom UNIQUE, categorie_id FK → CATEGORIES.id)
- ARTISANS(**id**, nom, note, ville, a_propos, email, site_web, top_artisan, specialite_id FK → SPECIALITES.id)

La table ARTISANS est liée à une seule spécialité, laquelle est liée à une seule catégorie. Les données sources contiennent 17 artisans.
