import type { AlphaReadApiResponse } from './alphaReadApi.js';
import type { AlphaReadModel } from './alphaReadModel.js';

export interface AlphaReportPage {
  statusCode: number;
  contentType: 'text/html; charset=utf-8';
  body: string;
}

const esc = (value: unknown): string =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const list = (values: readonly string[], emptyLabel = 'None recorded'): string =>
  values.length
    ? `<ul>${values.map(value => `<li>${esc(value)}</li>`).join('')}</ul>`
    : `<p class="muted">${esc(emptyLabel)}</p>`;

const scenario = (value: AlphaReadModel['scenarios'][number]): string => `
  <article class="scenario">
    <div class="eyebrow">${esc(value.kind)}</div>
    <p>${esc(value.narrative)}</p>
    <details>
      <summary>Evidence &amp; conditions</summary>
      <div class="detail-grid">
        <section><h4>Evidence</h4>${list(value.evidenceIds)}</section>
        <section><h4>Contradicting evidence</h4>${list(value.contradictingEvidenceIds)}</section>
        <section><h4>Catalysts</h4>${list(value.catalysts)}</section>
        <section><h4>Risks</h4>${list(value.risks)}</section>
        <section><h4>Invalidation</h4>${list(value.invalidationConditions)}</section>
      </div>
    </details>
  </article>`;

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="color-scheme" content="dark">
  <title>${esc(title)} · BLACK ORACLE REPORT</title>
  <style>
    :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f5f5f5;background:#090a0c}
    *{box-sizing:border-box} body{margin:0;background:linear-gradient(180deg,#0d0f13 0,#090a0c 38%);color:#f5f5f5}
    main{width:min(920px,100%);margin:0 auto;padding:max(24px,env(safe-area-inset-top)) 18px max(48px,env(safe-area-inset-bottom))}
    .brand{font-size:12px;letter-spacing:.18em;color:#9ca3af;margin-bottom:24px}.eyebrow{font-size:11px;letter-spacing:.14em;color:#aeb7c5;text-transform:uppercase}
    h1{font-size:clamp(30px,7vw,56px);line-height:1.02;margin:8px 0 16px;letter-spacing:-.04em} h2{font-size:20px;margin:0 0 12px} h3{font-size:16px;margin:0 0 8px} h4{font-size:13px;margin:0 0 8px;color:#c9d0da}
    p{line-height:1.65;color:#d5d9df}.summary{font-size:18px;color:#eef0f3}.muted{color:#8f98a6}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;overflow-wrap:anywhere}
    .card,.scenario{border:1px solid #242933;background:#101319;border-radius:20px;padding:18px;margin:14px 0}.scenario{background:#0e1116}
    .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:18px}.meta div{padding:12px;border-radius:14px;background:#0c0e12;border:1px solid #20242d}
    .label{display:block;font-size:11px;color:#7f8997;margin-bottom:5px}.value{font-size:13px;color:#e9edf3;overflow-wrap:anywhere}
    .scenarios{display:grid;grid-template-columns:1fr;gap:12px}.detail-grid{display:grid;grid-template-columns:1fr;gap:8px;margin-top:12px}
    ul{margin:8px 0 0;padding-left:20px;color:#cbd1d9} li{margin:7px 0;line-height:1.45} details{margin-top:12px} summary{cursor:pointer;color:#aeb7c5}
    .authority{display:flex;flex-wrap:wrap;gap:8px}.chip{border:1px solid #303640;border-radius:999px;padding:7px 10px;font-size:11px;color:#bec6d1;background:#0b0d11}
    @media(min-width:720px){main{padding-left:28px;padding-right:28px}.scenarios{grid-template-columns:repeat(3,minmax(0,1fr))}.detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.meta{grid-template-columns:repeat(4,minmax(0,1fr))}}
  </style>
</head>
<body><main>${body}</main></body>
</html>`;
}

export function renderAlphaReportPage(response: AlphaReadApiResponse): AlphaReportPage {
  if (response.statusCode !== 200 || response.body.ok !== true) {
    const error = typeof response.body.error === 'string' ? response.body.error : 'REPORT_UNAVAILABLE';
    return {
      statusCode: response.statusCode,
      contentType: 'text/html; charset=utf-8',
      body: shell('Report unavailable', `
        <div class="brand">BLACK ORACLE · REPORT</div>
        <section class="card">
          <div class="eyebrow">Fail-closed research surface</div>
          <h1>Report unavailable</h1>
          <p class="summary">The canonical Alpha report could not be displayed.</p>
          <p class="mono">${esc(error)}</p>
          <p class="muted">No missing or inconsistent research state was repaired or synthesized.</p>
        </section>`),
    };
  }

  const model = response.body.model as Readonly<AlphaReadModel>;
  const scenarios = model.scenarios.map(scenario).join('');
  return {
    statusCode: 200,
    contentType: 'text/html; charset=utf-8',
    body: shell(model.title, `
      <div class="brand">BLACK ORACLE · REPORT</div>
      <header>
        <div class="eyebrow">Alpha research artifact</div>
        <h1>${esc(model.title)}</h1>
        <p class="summary">${esc(model.summary)}</p>
        <div class="meta">
          <div><span class="label">Report</span><span class="value mono">${esc(model.reportId)}</span></div>
          <div><span class="label">Version</span><span class="value">v${esc(model.reportVersion)}</span></div>
          <div><span class="label">Series</span><span class="value mono">${esc(model.seriesId)}</span></div>
          <div><span class="label">As of</span><span class="value">${esc(model.asOf)}</span></div>
        </div>
      </header>
      <section class="card"><div class="eyebrow">Thesis</div><p class="summary">${esc(model.thesis)}</p></section>
      <section><h2>Scenarios</h2><div class="scenarios">${scenarios}</div></section>
      <section class="card"><h2>Evidence citations</h2>${list(model.citationEvidenceIds, 'No canonical Evidence citations recorded')}</section>
      <section class="card"><h2>Unresolved disagreements</h2>${list(model.unresolvedDisagreements)}</section>
      <section class="card"><h2>Data gaps</h2>${list(model.dataGaps)}</section>
      <section class="card">
        <h2>Authority boundary</h2>
        <div class="authority">
          <span class="chip">Execution authority: false</span>
          <span class="chip">Publication authority: false</span>
          <span class="chip">BOT dependency: false</span>
        </div>
        <p class="muted">This surface displays a verified research artifact only. It does not authorize trades or public publication.</p>
      </section>
      <footer class="mono muted">projection ${esc(model.projectionId)} · fingerprint ${esc(model.contentFingerprint)}</footer>
    `),
  };
}
