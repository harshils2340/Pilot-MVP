/**
 * Menu data normalizer — converts CSV, JSON, and parsed PDF output
 * into a standardized IMenuItem[] ready for BiSnapshot storage.
 *
 * Handles common CSV formats:
 *   name,price,category
 *   "Smash Burger",24,"Entrees"
 *
 * Handles JSON arrays:
 *   [{ "name": "Smash Burger", "price": 24, "category": "Entrees" }]
 *
 * Handles PDF parse output from pdfParser.ts.
 */

import type { IMenuItem } from '../biSnapshot/schema';
import { parseMenuPdf, type PdfParseResult } from './pdfParser';

export type IngestFormat = 'csv' | 'json' | 'pdf';

export interface IngestResult {
  items: IMenuItem[];
  format: IngestFormat;
  totalParsed: number;
  duplicatesSkipped: number;
  invalidSkipped: number;
  warnings: string[];
}

// ─── CSV parsing ─────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const HEADER_MAP: Record<string, string> = {
  name: 'name',
  item: 'name',
  itemname: 'name',
  menuitem: 'name',
  dish: 'name',
  product: 'name',
  price: 'price',
  cost: 'price',
  amount: 'price',
  category: 'category',
  section: 'category',
  type: 'category',
  group: 'category',
  description: 'description',
  desc: 'description',
  subcategory: 'subcategory',
  sub: 'subcategory',
};

function parseCsv(csvText: string): { items: Partial<IMenuItem>[]; warnings: string[] } {
  const warnings: string[] = [];
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);

  if (lines.length < 2) {
    warnings.push('CSV appears empty or has no data rows.');
    return { items: [], warnings };
  }

  const headerFields = parseCsvLine(lines[0]);
  const columnMap: Record<number, string> = {};

  for (let i = 0; i < headerFields.length; i++) {
    const normalized = normalizeHeader(headerFields[i]);
    const mapped = HEADER_MAP[normalized];
    if (mapped) {
      columnMap[i] = mapped;
    }
  }

  if (!Object.values(columnMap).includes('name')) {
    warnings.push('Could not find a "name" or "item" column in the CSV header. First column will be used as item name.');
    columnMap[0] = 'name';
  }

  const items: Partial<IMenuItem>[] = [];

  for (let row = 1; row < lines.length; row++) {
    const fields = parseCsvLine(lines[row]);
    const item: Record<string, string | number> = {};

    for (const [colIdx, fieldName] of Object.entries(columnMap)) {
      const value = fields[parseInt(colIdx, 10)];
      if (value !== undefined) {
        item[fieldName] = value;
      }
    }

    if (item.name && typeof item.name === 'string' && item.name.length >= 2) {
      const price = typeof item.price === 'string'
        ? parseFloat(item.price.replace(/[$,]/g, ''))
        : (item.price as number) ?? null;

      items.push({
        name: String(item.name),
        price: price && price > 0 && price < 500 ? price : null,
        category: String(item.category || 'Uncategorized'),
        subcategory: item.subcategory ? String(item.subcategory) : undefined,
        description: item.description ? String(item.description) : undefined,
      });
    }
  }

  return { items, warnings };
}

// ─── JSON parsing ────────────────────────────────────────────────────────────

function parseJson(jsonText: string): { items: Partial<IMenuItem>[]; warnings: string[] } {
  const warnings: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    warnings.push('Invalid JSON format. Please check your file.');
    return { items: [], warnings };
  }

  const arr = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>).items ?? (parsed as Record<string, unknown>).menu ?? (parsed as Record<string, unknown>).data;

  if (!Array.isArray(arr)) {
    warnings.push('JSON must be an array or an object with an "items", "menu", or "data" array.');
    return { items: [], warnings };
  }

  const items: Partial<IMenuItem>[] = [];

  for (const entry of arr) {
    if (typeof entry !== 'object' || entry === null) continue;
    const obj = entry as Record<string, unknown>;

    const name = obj.name ?? obj.item ?? obj.itemName ?? obj.dish ?? obj.product;
    if (!name || typeof name !== 'string' || name.length < 2) continue;

    const rawPrice = obj.price ?? obj.cost ?? obj.amount;
    let price: number | null = null;
    if (typeof rawPrice === 'number') {
      price = rawPrice > 0 && rawPrice < 500 ? rawPrice : null;
    } else if (typeof rawPrice === 'string') {
      const p = parseFloat(rawPrice.replace(/[$,]/g, ''));
      price = p > 0 && p < 500 ? p : null;
    }

    items.push({
      name: name.trim(),
      price,
      category: String(obj.category ?? obj.section ?? obj.type ?? 'Uncategorized'),
      subcategory: obj.subcategory ? String(obj.subcategory) : undefined,
      description: obj.description ? String(obj.description) : undefined,
    });
  }

  return { items, warnings };
}

// ─── Normalization + deduplication ────────────────────────────────────────────

function normalizeAndDeduplicate(
  rawItems: Partial<IMenuItem>[],
  source: 'manual_ingest',
  existingItems: IMenuItem[],
): { items: IMenuItem[]; duplicatesSkipped: number; invalidSkipped: number } {
  const seen = new Set<string>();
  let duplicatesSkipped = 0;
  let invalidSkipped = 0;

  for (const existing of existingItems) {
    seen.add(`${existing.name.toLowerCase()}|${existing.price ?? 'null'}`);
  }

  const items: IMenuItem[] = [];

  for (const raw of rawItems) {
    if (!raw.name || raw.name.length < 2) {
      invalidSkipped++;
      continue;
    }

    const key = `${raw.name.toLowerCase()}|${raw.price ?? 'null'}`;
    if (seen.has(key)) {
      duplicatesSkipped++;
      continue;
    }
    seen.add(key);

    items.push({
      name: raw.name.trim(),
      price: raw.price ?? null,
      category: raw.category || 'Uncategorized',
      subcategory: raw.subcategory,
      description: raw.description,
      source,
      confidence: raw.price != null ? 1.0 : 0.5,
      ingestedAt: new Date(),
    });
  }

  return { items, duplicatesSkipped, invalidSkipped };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function processMenuUpload(
  fileBuffer: ArrayBuffer,
  fileName: string,
  existingItems: IMenuItem[] = [],
): Promise<IngestResult> {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  const warnings: string[] = [];

  let rawItems: Partial<IMenuItem>[] = [];
  let format: IngestFormat;

  if (ext === 'pdf') {
    format = 'pdf';
    let pdfResult: PdfParseResult;
    try {
      pdfResult = await parseMenuPdf(fileBuffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return {
        items: [],
        format: 'pdf',
        totalParsed: 0,
        duplicatesSkipped: 0,
        invalidSkipped: 0,
        warnings: [`Failed to read PDF: ${msg}. Try uploading a CSV instead.`],
      };
    }

    warnings.push(...pdfResult.warnings);
    rawItems = pdfResult.items.map(item => ({
      name: item.name,
      price: item.price,
      category: item.category,
      description: undefined,
    }));
  } else if (ext === 'json') {
    format = 'json';
    const text = new TextDecoder().decode(fileBuffer);
    const result = parseJson(text);
    warnings.push(...result.warnings);
    rawItems = result.items;
  } else {
    format = 'csv';
    const text = new TextDecoder().decode(fileBuffer);
    const result = parseCsv(text);
    warnings.push(...result.warnings);
    rawItems = result.items;
  }

  const totalParsed = rawItems.length;
  const { items, duplicatesSkipped, invalidSkipped } = normalizeAndDeduplicate(
    rawItems,
    'manual_ingest',
    existingItems,
  );

  return {
    items,
    format,
    totalParsed,
    duplicatesSkipped,
    invalidSkipped,
    warnings,
  };
}
