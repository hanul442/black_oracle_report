-- BLACK ORACLE REPORT — Forecast History v2 (docs/contracts/FORECAST_HISTORY_CONTRACT_V2.md)
-- Additive migration. Forecast revisions and realized outcomes are append-only:
-- UPDATE, DELETE and TRUNCATE are rejected by triggers.
-- Rollback policy: stop writers and roll forward; never DROP history as rollback.

CREATE TABLE IF NOT EXISTS bor_forecast_history (
  forecast_artifact_id TEXT NOT NULL CHECK (length(trim(forecast_artifact_id)) > 0),
  forecast_revision_id TEXT NOT NULL CHECK (length(trim(forecast_revision_id)) > 0),
  schema_version TEXT NOT NULL CHECK (schema_version = 'bor.forecast-history.v2'),
  asset_id TEXT NOT NULL CHECK (length(trim(asset_id)) > 0),
  kind TEXT NOT NULL CHECK (kind IN ('FAIR_VALUE', 'FUTURE_PRICE')),
  as_of TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  lineage_state TEXT NOT NULL CHECK (lineage_state IN ('COMPLETE', 'INCOMPLETE_LEGACY')),
  availability TEXT NOT NULL CHECK (availability IN ('AVAILABLE', 'DEGRADED', 'UNAVAILABLE')),
  -- The full validated record, including the exact consumed Evidence revisions (CT-01).
  record JSONB NOT NULL CHECK (jsonb_typeof(record) = 'object'),
  stored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (forecast_artifact_id, forecast_revision_id),
  CONSTRAINT bor_forecast_history_recorded_after_as_of CHECK (recorded_at >= as_of),
  CONSTRAINT bor_forecast_history_record_identity CHECK (
    record->>'forecastArtifactId' = forecast_artifact_id
    AND record->>'forecastRevisionId' = forecast_revision_id
    AND record->>'schemaVersion' = schema_version
    AND record->>'assetId' = asset_id
    AND record->>'kind' = kind
    AND record->>'lineageState' = lineage_state
    AND record->>'availability' = availability
    AND jsonb_typeof(record->'consumedEvidence') = 'array'
  )
);

-- Point-in-time reads: latest complete forecast for an asset at a cutoff.
CREATE INDEX IF NOT EXISTS bor_forecast_history_asset_as_of_idx
  ON bor_forecast_history (asset_id, kind, as_of, recorded_at);

CREATE TABLE IF NOT EXISTS bor_forecast_realized_outcomes (
  outcome_seq BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  forecast_artifact_id TEXT NOT NULL,
  forecast_revision_id TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  outcome JSONB NOT NULL CHECK (jsonb_typeof(outcome) = 'object'),
  stored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (forecast_artifact_id, forecast_revision_id)
    REFERENCES bor_forecast_history (forecast_artifact_id, forecast_revision_id)
);

CREATE INDEX IF NOT EXISTS bor_forecast_realized_outcomes_forecast_idx
  ON bor_forecast_realized_outcomes (forecast_artifact_id, forecast_revision_id, outcome_seq);

CREATE OR REPLACE FUNCTION bor_forecast_reject_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'FORECAST_HISTORY_APPEND_ONLY: % on % is not allowed', TG_OP, TG_TABLE_NAME;
END;
$$;

CREATE OR REPLACE FUNCTION bor_forecast_outcome_after_as_of() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  forecast_as_of TIMESTAMPTZ;
BEGIN
  SELECT as_of INTO forecast_as_of FROM bor_forecast_history
   WHERE forecast_artifact_id = NEW.forecast_artifact_id
     AND forecast_revision_id = NEW.forecast_revision_id;
  IF forecast_as_of IS NOT NULL AND NEW.observed_at <= forecast_as_of THEN
    RAISE EXCEPTION 'OUTCOME_NOT_AFTER_AS_OF';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bor_forecast_history_append_only ON bor_forecast_history;
CREATE TRIGGER bor_forecast_history_append_only
  BEFORE UPDATE OR DELETE ON bor_forecast_history
  FOR EACH ROW EXECUTE FUNCTION bor_forecast_reject_mutation();

DROP TRIGGER IF EXISTS bor_forecast_history_no_truncate ON bor_forecast_history;
CREATE TRIGGER bor_forecast_history_no_truncate
  BEFORE TRUNCATE ON bor_forecast_history
  FOR EACH STATEMENT EXECUTE FUNCTION bor_forecast_reject_mutation();

DROP TRIGGER IF EXISTS bor_forecast_outcomes_append_only ON bor_forecast_realized_outcomes;
CREATE TRIGGER bor_forecast_outcomes_append_only
  BEFORE UPDATE OR DELETE ON bor_forecast_realized_outcomes
  FOR EACH ROW EXECUTE FUNCTION bor_forecast_reject_mutation();

DROP TRIGGER IF EXISTS bor_forecast_outcomes_no_truncate ON bor_forecast_realized_outcomes;
CREATE TRIGGER bor_forecast_outcomes_no_truncate
  BEFORE TRUNCATE ON bor_forecast_realized_outcomes
  FOR EACH STATEMENT EXECUTE FUNCTION bor_forecast_reject_mutation();

DROP TRIGGER IF EXISTS bor_forecast_outcomes_after_as_of ON bor_forecast_realized_outcomes;
CREATE TRIGGER bor_forecast_outcomes_after_as_of
  BEFORE INSERT ON bor_forecast_realized_outcomes
  FOR EACH ROW EXECUTE FUNCTION bor_forecast_outcome_after_as_of();

COMMENT ON TABLE bor_forecast_history IS
  'Append-only BLACK ORACLE forecast revisions bound to the exact Evidence revisions they consumed.';
COMMENT ON TABLE bor_forecast_realized_outcomes IS
  'Append-only realized outcomes linked to a forecast revision; observed strictly after its as-of.';
