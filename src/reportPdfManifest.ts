import { createHash } from 'node:crypto';
import { REPORT_EXPORT_SCHEMA_VERSION, type ReportExportArtifact } from './reportExport.js';

export const PDF_RENDER_MANIFEST_SCHEMA_VERSION = 'bor.pdf-render-manifest.v1' as const;

export interface PdfRenderManifest {
  schemaVersion: typeof PDF_RENDER_MANIFEST_SCHEMA_VERSION;
  sourceExportSchemaVersion: typeof REPORT_EXPORT_SCHEMA_VERSION;
  exportId: string;
  reportId: string;
  seriesId: string;
  reportVersion: number;
  reportAsOf: string;
  reportContentFingerprint: string;
  sourceExportFingerprint: string;
  title: string;
  summary: string;
  thesis: string;
  scenarios: ReportExportArtifact['scenarios'];
  citationEvidenceIds: readonly string[];
  unresolvedDisagreements: readonly string[];
  dataGaps: readonly string[];
  executionAuthority: false;
  reportPublicationAuthority: false;
}

export interface PreparedPdfRenderManifest {
  mediaType: 'application/vnd.black-oracle.pdf-render-manifest+json';
  manifest: Readonly<PdfRenderManifest>;
  bytes: string;
  contentFingerprint: string;
  executionAuthority: false;
  reportPublicationAuthority: false;
}

function hash(value: string) { return createHash('sha256').update(value, 'utf8').digest('hex'); }
function exportCore(value: Readonly<ReportExportArtifact>) {
  const { exportFingerprint: _fingerprint, executionAuthority: _execution, reportPublicationAuthority: _publication, ...core } = value;
  return core;
}
function required(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} is required`);
  return value;
}

export function verifyPdfExport(value: Readonly<ReportExportArtifact>) {
  if (value.schemaVersion !== REPORT_EXPORT_SCHEMA_VERSION) throw new Error('unsupported report export schema');
  if (value.format !== 'PDF') throw new Error('PDF manifest requires PDF export format');
  if (value.executionAuthority !== false || value.reportPublicationAuthority !== false) throw new Error('PDF manifest requires zero-authority export');
  required(value.exportId, 'exportId'); required(value.reportId, 'reportId'); required(value.seriesId, 'seriesId'); required(value.reportAsOf, 'reportAsOf');
  if (hash(JSON.stringify(exportCore(value))) !== value.exportFingerprint) throw new Error('report export fingerprint mismatch');
  return value;
}

export function preparePdfRenderManifest(value: Readonly<ReportExportArtifact>): Readonly<PreparedPdfRenderManifest> {
  verifyPdfExport(value);
  const manifest: PdfRenderManifest = {
    schemaVersion: PDF_RENDER_MANIFEST_SCHEMA_VERSION,
    sourceExportSchemaVersion: REPORT_EXPORT_SCHEMA_VERSION,
    exportId: value.exportId, reportId: value.reportId, seriesId: value.seriesId, reportVersion: value.reportVersion,
    reportAsOf: value.reportAsOf, reportContentFingerprint: value.reportContentFingerprint, sourceExportFingerprint: value.exportFingerprint,
    title: value.title, summary: value.summary, thesis: value.thesis, scenarios: value.scenarios,
    citationEvidenceIds: value.citationEvidenceIds, unresolvedDisagreements: value.unresolvedDisagreements, dataGaps: value.dataGaps,
    executionAuthority: false, reportPublicationAuthority: false
  };
  const bytes = JSON.stringify(manifest);
  return Object.freeze({ mediaType: 'application/vnd.black-oracle.pdf-render-manifest+json', manifest: Object.freeze(manifest), bytes, contentFingerprint: hash(bytes), executionAuthority: false, reportPublicationAuthority: false });
}
