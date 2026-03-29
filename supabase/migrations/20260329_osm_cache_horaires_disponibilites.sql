-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : cache OSM + horaires cliniques + disponibilités médecins
--
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- Ordre : après 20260328_add_specialite_to_rendez_vous.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Cache OSM (résultats Overpass mis en cache par zone + spécialité) ─────────
CREATE TABLE IF NOT EXISTS cliniques_osm_cache (
  id TEXT PRIMARY KEY,            -- "osm_{type}_{id}"
  nom TEXT NOT NULL,
  adresse TEXT,
  ville TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  telephone TEXT,
  specialites TEXT[],
  raw_tags JSONB,
  cache_key TEXT NOT NULL,        -- "{lat2}:{lon2}:{rayon}:{specialite}"
  last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_osm_cache_key     ON cliniques_osm_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_osm_cache_updated ON cliniques_osm_cache(last_updated);
CREATE INDEX IF NOT EXISTS idx_osm_coords        ON cliniques_osm_cache(latitude, longitude);

-- RLS : lecture publique, écriture service role uniquement
ALTER TABLE cliniques_osm_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique OSM cache"
  ON cliniques_osm_cache FOR SELECT
  USING (true);

-- ── Horaires des cliniques ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cliniques_horaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinique_id UUID NOT NULL REFERENCES cliniques(id) ON DELETE CASCADE,
  jour_semaine INT NOT NULL CHECK (jour_semaine BETWEEN 0 AND 6), -- 0=dimanche
  heure_ouverture TIME NOT NULL,
  heure_fermeture TIME NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinique_id, jour_semaine)
);

CREATE INDEX IF NOT EXISTS idx_horaires_clinique ON cliniques_horaires(clinique_id);

-- ── Disponibilités des médecins ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medecins_disponibilites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medecin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  jour_semaine INT NOT NULL CHECK (jour_semaine BETWEEN 0 AND 6),
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  duree_consultation_minutes INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispo_medecin ON medecins_disponibilites(medecin_id);
CREATE INDEX IF NOT EXISTS idx_dispo_jour    ON medecins_disponibilites(jour_semaine);

-- ─────────────────────────────────────────────────────────────────────────────
-- Vérification post-migration :
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN ('cliniques_osm_cache','cliniques_horaires','medecins_disponibilites');
-- ─────────────────────────────────────────────────────────────────────────────
