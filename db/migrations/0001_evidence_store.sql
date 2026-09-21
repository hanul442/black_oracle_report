-- BLACK ORACLE REPORT — Evidence Store v1
-- Additive migration. Historical Evidence is append-only at the application boundary.
-- Production rollback policy: stop writers / roll forward; never DROP historical Evidence as rollback.

CREATE TABLE IF NOT EXISTS bor_evidence (
  evidence_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL CHECK (schema_version = 'bor.evidence.v1'),
  producer TEXT NOT NULL CHECK (producer = 'BLACK_ORACLE_REPORT'),
  execution_authority BOOLEAN NOT NULL DEFAULT FALSE CHECK (execution_authority = FALSE),

  source_id TEXT NOT NULL CHECK (length(trim(source_id)) > 0),
  source_version TEXT NOT NULL CHECK (length(trim(source_version)) > 0),
  publisher TEXT NOT NULL CHECK (length(trim(publisher)) > 0),

  asset_status TEXT NOT NULL CHECK (asset_status IN ('RESOLVED', 'UNRESOLVED')),
  canonical_asset_id TEXT,
  asset_symbol TEXT,
  asset_query TEXT,
  asset_unresolved_reason TEXT,

  retrieval_uri TEXT NOT NULL CHECK (length(trim(retrieval_uri)) > 0),
  snapshot_ref TEXT,
  retrieved_by TEXT NOT NULL CHECK (length(trim(retrieved_by)) > 0),

  published_at TIMESTAMPTZ NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  content_fingerprint CHAR(64) NOT NULL CHECK (content_fingerprint ~ '^[0-9a-f]{64}$'),
  duplicate_of_evidence_id TEXT,
  stored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT bor_evidence_point_in_time CHECK (published_at <= observed_at),
  CONSTRAINT bor_evidence_not_self_duplicate CHECK (
    duplicate_of_evidence_id IS NULL OR duplicate_of_evidence_id <> evidence_id
  ),
  CONSTRAINT bor_evidence_asset_shape CHECK (
    (asset_status = 'RESOLVED' AND canonical_asset_id IS NOT NULL AND length(trim(canonical_asset_id)) > 0
      AND asset_query IS NULL AND asset_unresolved_reason IS NULL)
    OR
    (asset_status = 'UNRESOLVED' AND canonical_asset_id IS NULL
      AND asset_query IS NOT NULL AND length(trim(asset_query)) > 0
      AND asset_unresolved_reason IS NOT NULL AND length(trim(asset_unresolved_reason)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS bor_evidence_fingerprint_idx
  ON bor_evidence (content_fingerprint, observed_at, evidence_id);

CREATE INDEX IF NOT EXISTS bor_evidence_source_idx
  ON bor_evidence (source_id, source_version, observed_at);

COMMENT ON TABLE bor_evidence IS
  'Append-first BLACK ORACLE REPORT Evidence packets. BOR has no trading authority.';
