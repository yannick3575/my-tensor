-- ============================================
-- MY-TENSOR: Schéma de base de données
-- ============================================

-- Extension pour générer des UUIDs (déjà activée sur Supabase par défaut)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: projects
-- ============================================
-- Stocke les métadonnées de chaque micro-projet du Digital Garden.
-- Le champ 'slug' permet des URLs propres (/projects/btc-oracle).
-- Le champ 'tags' utilise un array PostgreSQL pour le filtrage.

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    tags TEXT[] DEFAULT '{}',  -- Array de tags pour catégorisation
    is_active BOOLEAN DEFAULT true,  -- Pour masquer un projet sans le supprimer
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index sur le slug pour des requêtes rapides
CREATE INDEX idx_projects_slug ON projects(slug);

-- Index GIN sur les tags pour recherche efficace dans les arrays
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);

-- Trigger pour mettre à jour automatiquement 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: crypto_metrics
-- ============================================
-- Stocke l'historique des prix et les prédictions du modèle.
-- Chaque ligne = une date avec son prix réel et/ou sa prédiction.
-- 'model_version' permet de tracker l'évolution des modèles.

CREATE TABLE IF NOT EXISTS crypto_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    symbol VARCHAR(20) NOT NULL DEFAULT 'BTC-USD',
    actual_price DECIMAL(18, 2),  -- Prix réel (NULL si c'est une prédiction future)
    predicted_price DECIMAL(18, 2),  -- Prédiction du modèle
    model_version VARCHAR(50) DEFAULT 'linear_v1',  -- Pour versionner les modèles
    confidence_score DECIMAL(5, 4),  -- Score de confiance optionnel (0-1)
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contrainte d'unicité: une seule entrée par date/symbol/version
    CONSTRAINT unique_date_symbol_version UNIQUE (date, symbol, model_version)
);

-- Index composé pour les requêtes fréquentes
CREATE INDEX idx_crypto_metrics_date_symbol ON crypto_metrics(date DESC, symbol);

-- Index pour filtrer par modèle
CREATE INDEX idx_crypto_metrics_model ON crypto_metrics(model_version);

-- ============================================
-- DONNÉE INITIALE: Projet BTC Oracle
-- ============================================
INSERT INTO projects (title, slug, description, tags) VALUES (
    'BTC Oracle',
    'btc-oracle',
    'Prédiction du cours Bitcoin à J+1 via régression linéaire. Premier micro-projet explorant les bases du Machine Learning appliqué à la finance.',
    ARRAY['machine-learning', 'finance', 'python', 'prediction']
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Active RLS mais permet la lecture publique (lecture seule)
-- Les écritures nécessiteront une clé service_role

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_metrics ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Public read access for projects"
    ON projects FOR SELECT
    USING (true);

CREATE POLICY "Public read access for crypto_metrics"
    ON crypto_metrics FOR SELECT
    USING (true);

-- Politique d'écriture via service_role uniquement (pour le script Python)
CREATE POLICY "Service role write access for crypto_metrics"
    ON crypto_metrics FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role update access for crypto_metrics"
    ON crypto_metrics FOR UPDATE
    USING (true);
