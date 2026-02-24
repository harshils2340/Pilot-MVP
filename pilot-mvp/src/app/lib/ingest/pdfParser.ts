/**
 * PDF menu parser using unpdf (serverless PDF.js build).
 *
 * Extracts raw text from uploaded PDF menus, then uses regex heuristics
 * to identify menu items and prices. The output is intentionally "best effort" —
 * PDF menus have wildly inconsistent formatting (columns, images-as-text,
 * decorative fonts, etc.), so we always flag results for human review.
 */

import { extractText, getDocumentProxy } from 'unpdf';

export interface RawMenuItem {
  name: string;
  price: number | null;
  category: string;
  confidence: number;
  lineText: string;
}

export interface PdfParseResult {
  items: RawMenuItem[];
  totalPages: number;
  rawText: string;
  warnings: string[];
}

// Pattern 1: "Smash Burger ... $24" or "Espresso Martini  18.00"
const PRICE_LINE_PATTERN = /^(.+?)\s*[.\-–—\s]{2,}\s*\$?\s*(\d{1,3}(?:\.\d{2})?)\s*$/;

// Pattern 2: "Item Name $24" at end of line
const PRICE_SUFFIX_PATTERN = /^(.+?)\s+\$(\d{1,3}(?:\.\d{2})?)\s*$/;

// Pattern 3: Price at END of line without dollar sign — "Truffle Fries 14"
const PRICE_END_NO_DOLLAR = /^([A-Za-z][\w\s''&\-/()]+?)\s+(\d{1,3}(?:\.\d{2})?)\s*$/;

// Pattern 4: Price at START of line (King Taps style) — "9½BELLWOODS" or "24 Smash Burger"
// Handles unicode fractions: ½ (0.50), ¼ (0.25), ¾ (0.75)
const PRICE_PREFIX_PATTERN = /^(\d{1,3}(?:\.\d{2})?)\s*([½¼¾])?\s*(.{3,80})$/;

// Pattern 5: Wine multi-price — "531812MONVIN" = bottle(53) 9oz(18) 6oz(12) name(MONVIN)
// Takes the first (bottle) price. Expects 3 concatenated 2-3 digit prices then a name.
const WINE_MULTI_PRICE = /^(\d{2,3})(\d{2})(\d{2})([A-Z].{2,60})$/;

const FRACTION_MAP: Record<string, number> = {
  '½': 0.50, '¼': 0.25, '¾': 0.75,
  '⅓': 0.33, '⅔': 0.67, '⅛': 0.125,
};

// Normalize fraction characters: "9½ITEM" → "9.50 ITEM", "9½ ITEM" → "9.50 ITEM"
function normalizeFractions(text: string): string {
  return text.replace(
    /(\d)([½¼¾\u00BC\u00BD\u00BE])\s*/g,
    (_, digit, frac) => {
      const val = FRACTION_MAP[frac] ?? 0;
      return (parseInt(digit) + val).toFixed(2) + ' ';
    },
  );
}

// Category headers are usually short, uppercase or title-case, no price
const CATEGORY_PATTERN = /^[A-Z][A-Z\s&/+]{2,35}$/;

// Lines that are likely noise (page numbers, footers, addresses)
const NOISE_PATTERNS = [
  /^page\s+\d+/i,
  /www\.|\.com|\.ca/i,
  /^\s*$/,
  /tel:|phone:|fax:/i,
  /all prices|tax|gratuity|subject to change/i,
  /^\d{3}[\s.-]\d{3}/,  // phone numbers
  /^\d{1,2}\/\d{1,2}\/\d{2,4}/,  // dates
  /https?:\/\//i,
  /^make it a\b/i,
  /^add\s+\w/i,  // modifiers like "add passion fruit"
  /^Bottle\d/i,  // wine header "Bottle9oz6oz"
  /^with\s+\w/i, // modifiers like "with casamigos"
];

function isNoise(line: string): boolean {
  return NOISE_PATTERNS.some(p => p.test(line.trim()));
}

function validItem(name: string, price: number): boolean {
  return name.length >= 2 && name.length <= 80 && price > 0 && price < 500;
}

function cleanName(raw: string): string {
  return raw
    .replace(/[.\-–—]+$/, '')
    .replace(/^[.\-–—]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parsePriceLine(line: string): { name: string; price: number; confidence: number } | null {
  const trimmed = line.trim();

  // Pattern 1: "Smash Burger ... $24"
  let match = trimmed.match(PRICE_LINE_PATTERN);
  if (match) {
    const name = cleanName(match[1]);
    const price = parseFloat(match[2]);
    if (validItem(name, price)) return { name, price, confidence: 0.8 };
  }

  // Pattern 2: "Item Name $24"
  match = trimmed.match(PRICE_SUFFIX_PATTERN);
  if (match) {
    const name = cleanName(match[1]);
    const price = parseFloat(match[2]);
    if (validItem(name, price)) return { name, price, confidence: 0.8 };
  }

  // Pattern 4: Price-first — "9½BELLWOODS 'JUTSU'" or "24 Smash Burger"
  match = trimmed.match(PRICE_PREFIX_PATTERN);
  if (match) {
    const basePrice = parseFloat(match[1]);
    const fraction = match[2] ? FRACTION_MAP[match[2]] ?? 0 : 0;
    const price = basePrice + fraction;
    const name = cleanName(match[3]);
    if (validItem(name, price) && /[A-Za-z]/.test(name)) {
      return { name, price, confidence: 0.65 };
    }
  }

  // Pattern 5: Wine multi-price — "531812MONVIN" (bottle/9oz/6oz concatenated)
  match = trimmed.match(WINE_MULTI_PRICE);
  if (match) {
    const bottlePrice = parseFloat(match[1]);
    const name = cleanName(match[4]);
    if (validItem(name, bottlePrice)) return { name, price: bottlePrice, confidence: 0.55 };
  }

  // Pattern 3: "Truffle Fries 14" (price at end, no dollar sign)
  match = trimmed.match(PRICE_END_NO_DOLLAR);
  if (match) {
    const name = cleanName(match[1]);
    const price = parseFloat(match[2]);
    if (validItem(name, price)) return { name, price, confidence: 0.6 };
  }

  return null;
}

function collapseSpacedLetters(s: string): string {
  // Split into segments by delimiters (+, &, -)
  const segments = s.split(/(\s+[-+&]\s+)/);

  return segments.map(seg => {
    // Keep delimiters unchanged
    if (/^\s+[-+&]\s+$/.test(seg)) return seg;

    const tokens = seg.trim().split(/\s+/);
    const singleCount = tokens.filter(t => t.length === 1 && /^[A-Z]$/.test(t)).length;

    // If majority of tokens are single letters, collapse everything
    if (tokens.length >= 2 && singleCount / tokens.length >= 0.5) {
      return tokens.join('');
    }
    return seg.trim();
  }).join(' ').replace(/\s{2,}/g, ' ').trim();
}

// Single words that are commonly places/regions, not menu categories
const NON_CATEGORY_WORDS = new Set([
  'toronto', 'japan', 'usa', 'mexico', 'belgium', 'ireland', 'france',
  'spain', 'italy', 'germany', 'australia', 'chile', 'argentina',
  'california', 'ontario', 'hamilton', 'ottawa', 'bracebridge',
  'collingwood', 'london', 'brewery', 'new', 'canada',
]);

function detectCategory(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 45) return null;

  const collapsed = collapseSpacedLetters(trimmed);

  // Must be all-uppercase to be a category (after collapsing spaced letters)
  if (!CATEGORY_PATTERN.test(collapsed)) return null;

  // Reject single words that are place names, not menu sections
  const lowerCollapsed = collapsed.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  if (NON_CATEGORY_WORDS.has(lowerCollapsed)) return null;

  // Reject very short single words (< 3 letters unless known category like "IPA")
  if (!collapsed.includes(' ') && !collapsed.includes('+') && !collapsed.includes('&')
      && collapsed.length < 3) {
    return null;
  }

  return collapsed;
}

export async function parseMenuPdf(pdfBuffer: ArrayBuffer): Promise<PdfParseResult> {
  const warnings: string[] = [];

  const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });

  const rawTextOriginal = Array.isArray(text) ? text.join('\n') : text;
  const rawText = normalizeFractions(rawTextOriginal);

  if (rawText.trim().length < 20) {
    warnings.push('Very little text extracted — this PDF might be image-based. Try uploading a CSV instead.');
    return { items: [], totalPages, rawText, warnings };
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items: RawMenuItem[] = [];
  let currentCategory = 'Uncategorized';
  const seenNames = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isNoise(line)) continue;

    const cat = detectCategory(line);
    if (cat) {
      currentCategory = cat
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      continue;
    }

    const parsed = parsePriceLine(line);
    if (parsed) {
      let fullName = parsed.name;

      // For price-prefix matches, look ahead to build the full item name.
      // E.g. "9BELLWOODS" on line i, then "'ULTRA PREMIUM'" on line i+1,
      // then "LAGER (4.0%)" on line i+2.
      if (parsed.confidence <= 0.65) {
        const nameParts = [fullName];
        let j = i + 1;
        while (j < lines.length && j <= i + 3) {
          const next = lines[j].trim();
          if (!next || isNoise(next) || detectCategory(next)) break;
          if (parsePriceLine(next)) break;
          // Continuation line: quoted names, descriptors, ABV, etc.
          if (/^['']/.test(next) || /^\([\d.]+%\)/.test(next)
              || /^[A-Z]{2,}/.test(next)) {
            nameParts.push(next);
            j++;
          } else {
            break;
          }
        }
        fullName = nameParts.join(' ').replace(/\s{2,}/g, ' ').trim();
        // Skip the consumed continuation lines
        i = j - 1;
      }

      const key = fullName.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        items.push({
          name: fullName,
          price: parsed.price,
          category: currentCategory,
          confidence: parsed.confidence,
          lineText: line,
        });
      }
    }
  }

  if (items.length === 0 && lines.length > 5) {
    warnings.push('Could not identify menu items with prices. The PDF format may not be parseable — try CSV or JSON upload.');
  } else if (items.length < 5 && lines.length > 20) {
    warnings.push(`Only ${items.length} items found — some may have been missed. Please review and add any missing items.`);
  }

  if (totalPages > 5) {
    warnings.push('Large PDF detected. Only text-based content was processed — images and decorative elements are skipped.');
  }

  return { items, totalPages, rawText, warnings };
}
