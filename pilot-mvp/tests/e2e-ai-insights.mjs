/**
 * E2E test for AI Insights: menu uploads (PDF + CSV) and chatbot queries.
 *
 * Requires the dev server running on localhost:3000 and a valid client
 * with an existing BiSnapshot (run a scan first).
 *
 * Usage:  node tests/e2e-ai-insights.mjs [clientId]
 */

import { readFileSync } from 'fs';
import { basename } from 'path';

// ── Config ──────────────────────────────────────────────────────────────────
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const CLIENT_ID = process.argv[2] ?? '699a6f0fd677d37d99c1df11';

const PDF_PATH = '/Users/koushik/Downloads/king-taps-menu.pdf';
const CSV_PATH = '/Users/koushik/Downloads/menu.csv';

const QUERIES = [
  // Recommended / suggested follow-up questions
  { label: 'Competitive landscape', q: "What's the competitive landscape?" },
  { label: 'Biggest gaps', q: 'Where are the biggest gaps I can own?' },
  { label: 'Pricing comparison', q: 'How does my pricing compare?' },
  { label: 'Customer complaints', q: 'What are customers complaining about?' },

  // Custom questions
  { label: 'Menu differentiation', q: 'What menu items are my competitors offering that I should consider adding?' },
  { label: 'Peak hours strategy', q: 'When are the busiest hours in my area and how should I staff for them?' },

  // Revenue & growth / projection models
  { label: 'Revenue estimate', q: 'What is the estimated revenue range for restaurants in this corridor?' },
  { label: 'Growth opportunities', q: 'What are the top growth opportunities based on foot traffic and review trends?' },
  { label: 'RevPASH projections', q: 'How does my revenue per available seat hour compare to competitors?' },
  { label: 'Pricing strategy', q: 'Based on the data, should I raise or lower my prices and on which items?' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  console.log(`  ✅  ${label}`);
}

function fail(label, reason) {
  failed++;
  console.error(`  ❌  ${label} — ${reason}`);
}

async function uploadFile(filePath, tag) {
  const fileName = basename(filePath);
  const fileBytes = readFileSync(filePath);
  const blob = new Blob([fileBytes]);

  const form = new FormData();
  form.append('clientId', CLIENT_ID);
  form.append('file', blob, fileName);

  const res = await fetch(`${BASE}/api/ai-insights/ingest`, {
    method: 'POST',
    body: form,
  });

  const body = await res.json();

  if (!res.ok) {
    fail(`${tag} upload (${fileName})`, `HTTP ${res.status}: ${body.error ?? body.details ?? 'unknown'}`);
    return null;
  }

  if (!body.success) {
    fail(`${tag} upload (${fileName})`, `success=false: ${JSON.stringify(body.warnings ?? body)}`);
    return null;
  }

  const added = body.itemsAdded ?? 0;
  const dupes = body.duplicatesSkipped ?? 0;
  ok(`${tag} upload (${fileName}) — ${added} items added, ${dupes} duplicates skipped, format=${body.format}`);
  return body;
}

async function askQuery({ label, q }) {
  const res = await fetch(`${BASE}/api/ai-insights/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: CLIENT_ID, query: q }),
  });

  const body = await res.json();

  if (!res.ok) {
    fail(label, `HTTP ${res.status}`);
    return;
  }

  const sentences = body.sentences ?? [];
  const followUps = body.followUps ?? [];

  if (sentences.length === 0) {
    fail(label, 'Empty sentences array');
    return;
  }

  const isErrorResponse = sentences.some(
    (s) =>
      s.includes('ran into an issue') ||
      s.includes("hasn't been set up") ||
      s.includes('Please try again'),
  );

  if (isErrorResponse) {
    fail(label, `Got error/fallback response: "${sentences[0]}"`);
    return;
  }

  const hasComponents = (body.components ?? []).length > 0;
  ok(
    `${label} — ${sentences.length} sentence(s), ${hasComponents ? body.components.length + ' component(s)' : 'no components'}, ${followUps.length} follow-up(s)`,
  );

  // Print a snippet of the first sentence for manual review
  const preview = sentences[0].length > 120 ? sentences[0].slice(0, 120) + '…' : sentences[0];
  console.log(`        💬  "${preview}"`);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔬  AI Insights E2E Test`);
  console.log(`    Base URL:   ${BASE}`);
  console.log(`    Client ID:  ${CLIENT_ID}\n`);

  // ── Step 0: Verify server is reachable ──────────────────────────────────
  console.log('── Step 0: Server health check ──');
  try {
    const ping = await fetch(`${BASE}/api/ai-insights/summary?clientId=${CLIENT_ID}`);
    if (!ping.ok) {
      fail('Server health', `HTTP ${ping.status}`);
      process.exit(1);
    }
    const summary = await ping.json();
    if (summary.status === 'error') {
      fail('Server health', summary.error);
      process.exit(1);
    }
    ok(`Server reachable — snapshot status: ${summary.status}, readiness: ${summary.readinessPercent}%`);
  } catch (err) {
    fail('Server health', err.message);
    console.error('\n⛔  Dev server not reachable. Start it with `npm run dev` first.\n');
    process.exit(1);
  }

  // ── Step 1: Upload PDF menu ─────────────────────────────────────────────
  console.log('\n── Step 1: Upload PDF menu (king-taps-menu.pdf) ──');
  await uploadFile(PDF_PATH, 'PDF');

  // ── Step 2: Upload CSV menu ─────────────────────────────────────────────
  console.log('\n── Step 2: Upload CSV menu (menu.csv) ──');
  await uploadFile(CSV_PATH, 'CSV');

  // ── Step 3: Re-upload PDF to verify deduplication ───────────────────────
  console.log('\n── Step 3: Re-upload PDF to verify deduplication ──');
  const dupeResult = await uploadFile(PDF_PATH, 'PDF-dedup');
  if (dupeResult && dupeResult.itemsAdded > 0 && dupeResult.duplicatesSkipped === 0) {
    fail('Deduplication check', `Expected duplicates to be detected, but ${dupeResult.itemsAdded} items were added as new`);
  } else if (dupeResult) {
    ok(`Deduplication working — ${dupeResult.duplicatesSkipped} duplicates correctly identified`);
  }

  // ── Step 4: Ask recommended + custom questions ──────────────────────────
  console.log('\n── Step 4: Chatbot queries (recommended + custom + revenue/growth) ──');
  for (const q of QUERIES) {
    await askQuery(q);
  }

  // ── Step 5: Off-topic guardrail ─────────────────────────────────────────
  console.log('\n── Step 5: Off-topic guardrail ──');
  const offTopicRes = await fetch(`${BASE}/api/ai-insights/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: CLIENT_ID, query: 'What is the weather today?' }),
  });
  const offTopicBody = await offTopicRes.json();
  const offTopicText = (offTopicBody.sentences ?? []).join(' ').toLowerCase();
  if (
    offTopicText.includes('specialized') ||
    offTopicText.includes('restaurant') ||
    offTopicText.includes('competitive intelligence')
  ) {
    ok('Off-topic guardrail — correctly refused non-restaurant question');
  } else {
    fail('Off-topic guardrail', `Expected redirection, got: "${offTopicBody.sentences?.[0] ?? 'empty'}"`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  Results:  ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('══════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
