-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : ajout de la colonne `specialite` dans rendez_vous
--
-- Objectif : séparer la spécialité médicale (dialyse, cardiologie…)
--            du motif personnel du patient (raison de consultation).
--
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Ajouter la colonne specialite (nullable pour compatibilité avec l'existant)
ALTER TABLE rendez_vous
  ADD COLUMN IF NOT EXISTS specialite TEXT;

-- 2. Migrer les anciennes données : si le motif ressemble à une spécialité connue,
--    le copier dans specialite (optionnel, à adapter selon vos données)
-- UPDATE rendez_vous
--   SET specialite = motif
--   WHERE specialite IS NULL AND motif IS NOT NULL;

-- 3. Index pour filtrer et grouper par spécialité (dashboard, stats)
CREATE INDEX IF NOT EXISTS idx_rdv_specialite
  ON rendez_vous (specialite);

CREATE INDEX IF NOT EXISTS idx_rdv_clinique_specialite
  ON rendez_vous (clinique_id, specialite);

CREATE INDEX IF NOT EXISTS idx_rdv_specialite_date
  ON rendez_vous (specialite, date_rdv);

-- ─── Résultat attendu ─────────────────────────────────────────────────────────
-- SELECT specialite, COUNT(*) as total
-- FROM rendez_vous
-- WHERE clinique_id = '<votre_clinique_id>'
-- GROUP BY specialite
-- ORDER BY total DESC;
-- ─────────────────────────────────────────────────────────────────────────────
