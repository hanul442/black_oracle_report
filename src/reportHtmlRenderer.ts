import { createHash } from 'node:crypto';
import { REPORT_EXPORT_SCHEMA_VERSION, type ReportExportArtifact } from './reportExport.js';

export interface RenderedHtmlReport {
  mediaType: 'text/html; charset=utf-8';
  exportId: string;
  reportId: string;
  html: string;
  contentFingerprint: string;
  executionAuthority: false;
  reportPublicationAuthority: false;
}

function fingerprint(payload: string) {
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
function exportCore(value: Readonly<ReportExportArtifact>) {
  const { exportFingerprint: _fingerprint, executionAuthority: _execution, reportPublicationAuthority: _publication, ...core } = value;
  return core;
}
function esc(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function required(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} is required`);
  return value;
}
function list(items: readonly string[]) {
  return items.length ? `<ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>None recorded.</p>';
}

export function verifyHtmlExport(value: Readonly<ReportExportArtifact>) {
  if (value.schemaVersion !== REPORT_EXPORT_SCHEMA_VERSION) throw new Error('unsupported report export schema');
  if (value.format !== 'HTML') throw new Error('HTML renderer requires HTML export format');
  if (value.executionAuthority !== false || value.reportPublicationAuthority !== false) throw new Error('HTML renderer requires zero-authority export');
  required(value.exportId, 'exportId'); required(value.reportId, 'reportId'); required(value.seriesId, 'seriesId');
  if (fingerprint(JSON.stringify(exportCore(value))) !== value.exportFingerprint) throw new Error('report export fingerprint mismatch');
  return value;
}

export function renderReportHtml(value: Readonly<ReportExportArtifact>): Readonly<RenderedHtmlReport> {
  verifyHtmlExport(value);
  const scenarios = value.scenarios.map(s => `<section data-scenario="${esc(s.kind)}"><h3>${esc(s.kind)}</h3><p>${esc(s.narrative)}</p><h4>Evidence</h4>${list(s.evidenceIds)}<h4>Contradicting evidence</h4>${list(s.contradictingEvidenceIds)}<h4>Catalysts</h4>${list(s.catalysts)}<h4>Risks</h4>${list(s.risks)}<h4>Invalidation</h4>${list(s.invalidationConditions)}</section>`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(value.title)}</title></head><body data-schema="${REPORT_EXPORT_SCHEMA_VERSION}" data-export-id="${esc(value.exportId)}" data-report-id="${esc(value.reportId)}"><main><header><h1>${esc(value.title)}</h1><p>${esc(value.summary)}</p><dl><dt>Report</dt><dd>${esc(value.reportId)}</dd><dt>Series</dt><dd>${esc(value.seriesId)}</dd><dt>Version</dt><dd>${value.reportVersion}</dd><dt>As of</dt><dd>${esc(value.reportAsOf)}</dd></dl></header><section><h2>Thesis</h2><p>${esc(value.thesis)}</p></section><section><h2>Scenarios</h2>${scenarios}</section><section><h2>Citations</h2>${list(value.citationEvidenceIds)}</section><section><h2>Unresolved disagreements</h2>${list(value.unresolvedDisagreements)}</section><section><h2>Data gaps</h2>${list(value.dataGaps)}</section></main></body></html>`;
  return Object.freeze({ mediaType:'text/html; charset=utf-8', exportId:value.exportId, reportId:value.reportId, html, contentFingerprint:fingerprint(html), executionAuthority:false, reportPublicationAuthority:false });
}
