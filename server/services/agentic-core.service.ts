/**
 * Agentic Core Service
 * Wraps the agentic-core AI microservice for document extraction.
 * Uses two endpoints:
 *   1. /api/blocks/file/analyze  — OCR / file text extraction
 *   2. /api/blocks/extract/json  — Structured JSON extraction from text
 */

const AGENTIC_CORE_URL = process.env.AGENTIC_CORE_URL;
if (!AGENTIC_CORE_URL) throw new Error('AGENTIC_CORE_URL environment variable is required');
const REQUEST_TIMEOUT_MS = 60_000;

interface DocumentPayload {
  base64: string;
  mimeType: string;
  filename: string;
}

interface FileAnalyzeResponse {
  text: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
}

export interface ExtractedPurchaseItem {
  name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
}

export interface ExtractedPurchaseData {
  supplier_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  items: ExtractedPurchaseItem[];
  subtotal: number | null;
  tax_amount: number | null;
  total_amount: number | null;
}

/**
 * Step 1: Send a document (PDF or image) to agentic-core for text extraction.
 */
async function analyzeFile(document: DocumentPayload): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${AGENTIC_CORE_URL}/api/blocks/file/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: {
          base64: document.base64,
          mimeType: document.mimeType,
          filename: document.filename,
        },
        instruction:
          'Extract all visible text from this purchase bill exactly as it appears, including supplier name, invoice number, dates, item names, quantities, unit prices, taxes, and totals.',
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`File analyze failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as FileAnalyzeResponse;
    if (!data.text) {
      throw new Error('File analyze returned empty text');
    }
    return data.text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Step 2: Extract structured JSON from raw text using the JSON extractor block.
 */
async function extractJson(text: string): Promise<ExtractedPurchaseData> {
  const schema = JSON.stringify({
    supplier_name: 'string | null',
    invoice_number: 'string | null',
    invoice_date: 'string | null',
    items: [{ name: 'string', sku: 'string | null', quantity: 'number', unit_price: 'number' }],
    subtotal: 'number | null',
    tax_amount: 'number | null',
    total_amount: 'number | null',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${AGENTIC_CORE_URL}/api/blocks/extract/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        schema,
        system_prompt:
          'Extract purchase bill data into the given JSON schema. Return only valid JSON matching the schema exactly. If a field is not found in the text, use null. For items array, include every line item found with numeric quantity and unit_price.',
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`JSON extract failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    // The response text field contains the JSON string
    const rawText: string = typeof data === 'string' ? data : data.text ?? JSON.stringify(data);
    const parsed = JSON.parse(rawText) as ExtractedPurchaseData;

    // Ensure items is always an array
    if (!Array.isArray(parsed.items)) {
      parsed.items = [];
    }

    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Full pipeline: file → text extraction → structured JSON
 */
export async function extractPurchaseFromDocument(
  document: DocumentPayload,
): Promise<ExtractedPurchaseData> {
  const text = await analyzeFile(document);
  const structured = await extractJson(text);
  return structured;
}
