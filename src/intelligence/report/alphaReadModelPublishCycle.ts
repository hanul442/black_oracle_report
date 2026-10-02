import type { ReportArtifact } from './reportArtifact.js';
import type { ReportExportArtifact } from './reportExport.js';
import type { ReportConsistencyResult } from './reportConsistency.js';
import {
  createAlphaReadModel,
  type AlphaReadModel,
  type AlphaReadModelInput,
} from './alphaReadModel.js';
import {
  persistAlphaReadModelArtifact,
  type AlphaReadModelArtifactWriteResult,
} from './alphaReadModelArtifactWriter.js';

export interface AlphaReadModelPublishResult {
  model: Readonly<AlphaReadModel>;
  persistence: Readonly<AlphaReadModelArtifactWriteResult>;
  executionAuthority: false;
  reportPublicationAuthority: false;
  botDependency: false;
}

/**
 * Internal BOR handoff from already-versioned canonical report/export parents
 * to the private runtime artifact. This does not publish a report externally.
 * Integrity and authority policy remain owned by S15/S16 and S20.
 */
export function publishAlphaReadModelArtifact(
  report: Readonly<ReportArtifact>,
  exported: Readonly<ReportExportArtifact>,
  consistency: Readonly<ReportConsistencyResult>,
  input: Readonly<AlphaReadModelInput>,
  artifactPath: string,
): Readonly<AlphaReadModelPublishResult> {
  const model = createAlphaReadModel(report, exported, consistency, input);
  const persistence = persistAlphaReadModelArtifact(model, artifactPath);

  return Object.freeze({
    model,
    persistence,
    executionAuthority: false,
    reportPublicationAuthority: false,
    botDependency: false,
  });
}
