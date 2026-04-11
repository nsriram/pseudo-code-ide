/**
 * generate-report.ts
 *
 * Reads ESLint JSON output (from `npm run lint:report`) and produces an HTML
 * dashboard suitable for publishing to GitHub Pages.
 *
 * Usage:
 *   npm run lint:report        # writes eslint-report.json
 *   npm run report:generate    # reads eslint-report.json → public/report/index.html
 */

import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'

interface EslintMessage {
  ruleId: string | null
  severity: number
  message: string
  line: number
  column: number
}

interface EslintFileResult {
  filePath: string
  messages: EslintMessage[]
  errorCount: number
  warningCount: number
}

const root = resolve(import.meta.dirname, '..')
const inputPath = resolve(root, 'eslint-report.json')
const outputDir = resolve(root, 'public', 'report')
const outputPath = resolve(outputDir, 'index.html')

const raw = readFileSync(inputPath, 'utf-8')
const results: EslintFileResult[] = JSON.parse(raw)

const totalErrors = results.reduce((s, r) => s + r.errorCount, 0)
const totalWarnings = results.reduce((s, r) => s + r.warningCount, 0)
const filesWithIssues = results.filter((r) => r.messages.length > 0)

// Rule frequency
const ruleFreq = new Map<string, number>()
for (const file of results) {
  for (const msg of file.messages) {
    const rule = msg.ruleId ?? '(unknown)'
    ruleFreq.set(rule, (ruleFreq.get(rule) ?? 0) + 1)
  }
}
const topRules = [...ruleFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripRoot(p: string): string {
  return p.replace(root + '/', '')
}

const issueRows = filesWithIssues
  .flatMap((file) =>
    file.messages.map(
      (m) => `
      <tr>
        <td>${esc(stripRoot(file.filePath))}</td>
        <td>${m.line}:${m.column}</td>
        <td class="${m.severity === 2 ? 'error' : 'warn'}">${m.severity === 2 ? 'error' : 'warn'}</td>
        <td>${esc(m.ruleId ?? '(unknown)')}</td>
        <td>${esc(m.message)}</td>
      </tr>`,
    ),
  )
  .join('')

const ruleRows = topRules
  .map(
    ([rule, count]) => `
      <tr>
        <td>${esc(rule)}</td>
        <td>${count}</td>
      </tr>`,
  )
  .join('')

let statusClass: string
let statusLabel: string
if (totalErrors > 0) {
  statusClass = 'fail'
  statusLabel = 'FAIL'
} else if (totalWarnings > 0) {
  statusClass = 'warn'
  statusLabel = 'WARN'
} else {
  statusClass = 'pass'
  statusLabel = 'PASS'
}
const generatedAt = new Date().toISOString()

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Code Quality Report — Pseudocode IDE</title>
  <style>
    :root {
      --bg: #1e1e2e; --surface: #313244; --overlay: #45475a;
      --text: #cdd6f4; --subtext: #a6adc8;
      --red: #f38ba8; --yellow: #f9e2af; --green: #a6e3a1;
      --blue: #89b4fa; --mauve: #cba6f7;
      font-family: system-ui, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); padding: 2rem; }
    h1 { color: var(--mauve); margin-bottom: 0.25rem; }
    .meta { color: var(--subtext); font-size: 0.85rem; margin-bottom: 2rem; }
    .cards { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .card { background: var(--surface); border-radius: 8px; padding: 1rem 1.5rem; min-width: 140px; }
    .card .label { font-size: 0.75rem; color: var(--subtext); text-transform: uppercase; letter-spacing: 0.05em; }
    .card .value { font-size: 2rem; font-weight: 700; margin-top: 0.25rem; }
    .card.pass .value { color: var(--green); }
    .card.fail .value { color: var(--red); }
    .card.warn .value { color: var(--yellow); }
    .card.neutral .value { color: var(--blue); }
    h2 { color: var(--blue); margin: 1.5rem 0 0.75rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { background: var(--overlay); color: var(--subtext); text-align: left; padding: 0.5rem 0.75rem; }
    td { padding: 0.4rem 0.75rem; border-bottom: 1px solid var(--surface); }
    tr:hover td { background: var(--surface); }
    .error { color: var(--red); font-weight: 600; }
    .warn { color: var(--yellow); }
    .pass { color: var(--green); }
  </style>
</head>
<body>
  <h1>Code Quality Report</h1>
  <p class="meta">Pseudocode IDE &mdash; generated ${generatedAt}</p>

  <div class="cards">
    <div class="card ${statusClass}">
      <div class="label">Status</div>
      <div class="value">${statusLabel}</div>
    </div>
    <div class="card ${totalErrors > 0 ? 'fail' : 'neutral'}">
      <div class="label">Errors</div>
      <div class="value">${totalErrors}</div>
    </div>
    <div class="card ${totalWarnings > 0 ? 'warn' : 'neutral'}">
      <div class="label">Warnings</div>
      <div class="value">${totalWarnings}</div>
    </div>
    <div class="card neutral">
      <div class="label">Files scanned</div>
      <div class="value">${results.length}</div>
    </div>
    <div class="card neutral">
      <div class="label">Files with issues</div>
      <div class="value">${filesWithIssues.length}</div>
    </div>
  </div>

  ${
    topRules.length > 0
      ? `<h2>Top Rules Triggered</h2>
  <table>
    <thead><tr><th>Rule</th><th>Count</th></tr></thead>
    <tbody>${ruleRows}</tbody>
  </table>`
      : ''
  }

  ${
    issueRows
      ? `<h2>All Issues</h2>
  <table>
    <thead>
      <tr><th>File</th><th>Location</th><th>Severity</th><th>Rule</th><th>Message</th></tr>
    </thead>
    <tbody>${issueRows}</tbody>
  </table>`
      : '<h2 class="pass">No issues found &#x2714;</h2>'
  }
</body>
</html>`

mkdirSync(outputDir, { recursive: true })
writeFileSync(outputPath, html, 'utf-8')
console.log(`Report written to ${outputPath}`)
console.log(`  ${totalErrors} error(s), ${totalWarnings} warning(s) across ${results.length} file(s)`)