import { createHash } from 'node:crypto';
import { PDF_RENDER_MANIFEST_SCHEMA_VERSION, type PreparedPdfRenderManifest } from './reportPdfManifest.js';

export interface RenderedPdfArtifact {
  mediaType: 'application/pdf';
  bytes: Buffer;
  contentFingerprint: string;
  sourceManifestFingerprint: string;
  executionAuthority: false;
  reportPublicationAuthority: false;
}

function hashBytes(value: string | Buffer) { return createHash('sha256').update(value).digest('hex'); }
function required(value: string, field: string) { if (!value.trim()) throw new Error(`${field} is required`); return value; }
function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\r\n\t]/g, ' ');
}

function verifyManifest(value: Readonly<PreparedPdfRenderManifest>) {
  if (value.manifest.schemaVersion !== PDF_RENDER_MANIFEST_SCHEMA_VERSION) throw new Error('unsupported PDF render manifest schema');
  if (value.executionAuthority !== false || value.reportPublicationAuthority !== false || value.manifest.executionAuthority !== false || value.manifest.reportPublicationAuthority !== false) throw new Error('PDF renderer requires zero-authority manifest');
  required(value.manifest.exportId, 'exportId'); required(value.manifest.reportId, 'reportId'); required(value.manifest.seriesId, 'seriesId'); required(value.manifest.reportAsOf, 'reportAsOf');
  if (value.bytes !== JSON.stringify(value.manifest)) throw new Error('PDF render manifest bytes mismatch');
  if (hashBytes(value.bytes) !== value.contentFingerprint) throw new Error('PDF render manifest fingerprint mismatch');
}

function linesFor(value: Readonly<PreparedPdfRenderManifest>) {
  const m = value.manifest;
  const lines = [
    'BLACK ORACLE REPORT',
    `Title: ${m.title}`,
    `Report: ${m.reportId} / Series: ${m.seriesId} / Version: ${m.reportVersion}`,
    `Export: ${m.exportId} / As of: ${m.reportAsOf}`,
    `Thesis: ${m.thesis}`,
    ...m.scenarios.map(s => `${s.kind}: ${s.narrative} | evidence=${s.evidenceIds.join(',')} | contradicting=${s.contradictingEvidenceIds.join(',')}`),
    `Citations: ${m.citationEvidenceIds.join(',')}`,
    `Unresolved disagreements: ${m.unresolvedDisagreements.join(' | ') || 'NONE'}`,
    `Data gaps: ${m.dataGaps.join(' | ') || 'NONE'}`,
    `Source manifest SHA-256: ${value.contentFingerprint}`,
    'Execution authority: false / Publication authority: false'
  ];
  return lines.map(escapePdfText);
}

function buildPdf(lines: readonly string[]) {
  const commands = ['BT', '/F1 10 Tf', '48 792 Td'];
  for (let i = 0; i < lines.length; i += 1) {
    if (i > 0) commands.push('0 -18 Td');
    commands.push(`(${lines[i]}) Tj`);
  }
  commands.push('ET');
  const stream = `${commands.join('\n')}\n`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];
  let pdf = '%PDF-1.4\n%BOR\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

export function renderPdfBytes(value: Readonly<PreparedPdfRenderManifest>): Readonly<RenderedPdfArtifact> {
  verifyManifest(value);
  const bytes = buildPdf(linesFor(value));
  return Object.freeze({ mediaType: 'application/pdf', bytes, contentFingerprint: hashBytes(bytes), sourceManifestFingerprint: value.contentFingerprint, executionAuthority: false, reportPublicationAuthority: false });
}
