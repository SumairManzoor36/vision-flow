import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

let cachedClient: GoogleGenerativeAI | null = null;

function getClient() {
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to your .env file."
    );
  }
  if (!cachedClient) cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
}

export const VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-2.0-flash-exp";
export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-1.5-pro";

export function getVisionModel(): GenerativeModel {
  return getClient().getGenerativeModel({
    model: VISION_MODEL,
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });
}

export function getTextModel(): GenerativeModel {
  return getClient().getGenerativeModel({
    model: TEXT_MODEL,
    generationConfig: {
      temperature: 0.4,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });
}

// Detection types
export type DetectedItem = {
  label: string;
  category?: string;
  quantity: number;
  confidence: number; // 0..1
  boundingBox?: { x: number; y: number; width: number; height: number };
  notes?: string;
};

export type VisionAnalysisResult = {
  items: DetectedItem[];
  totalItems: number;
  overallConfidence: number;
  summary: string;
  warnings?: string[];
  raw: string;
};

const VISION_PROMPT = `You are an expert inventory auditor AI. Analyze the provided image of a warehouse, shelf, store, or stockroom and produce a structured JSON inventory count.

Detect every distinct product / item visible. Group identical items together and provide a count. Estimate a bounding box (as fractional 0..1 coordinates of image) when possible.

STRICT OUTPUT — return ONLY valid JSON matching this TypeScript type:

{
  "items": [
    {
      "label": string,            // human-readable product name
      "category": string,         // e.g. "Beverages", "Electronics", "Apparel"
      "quantity": number,         // integer count
      "confidence": number,       // 0..1
      "boundingBox": { "x": number, "y": number, "width": number, "height": number },
      "notes": string             // optional, e.g. "damaged", "partially obscured"
    }
  ],
  "totalItems": number,
  "overallConfidence": number,    // 0..1
  "summary": string,              // 1-3 sentences plain English summary
  "warnings": string[]            // anything ambiguous, lighting issues, occlusion
}

Rules:
- Never fabricate items.
- Be conservative with quantity when uncertain; lower confidence accordingly.
- If unsure of the exact brand, use a generic descriptor (e.g. "Red soda can").
- Output JSON only. No markdown, no commentary.`;

export async function analyzeImage(
  imageBase64: string,
  mimeType = "image/jpeg",
  expectedContext?: string
): Promise<VisionAnalysisResult> {
  const model = getVisionModel();
  const context = expectedContext
    ? `\n\nAUDIT CONTEXT: ${expectedContext}`
    : "";

  const result = await model.generateContent([
    { text: VISION_PROMPT + context },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const raw = result.response.text();
  return parseVisionResponse(raw);
}

function parseVisionResponse(raw: string): VisionAnalysisResult {
  let jsonStr = raw.trim();

  // Strip code fences if model wrapped them despite instructions
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }

  let parsed: Partial<VisionAnalysisResult> = {};
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Try to extract the first JSON object
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = {};
      }
    }
  }

  const items: DetectedItem[] = Array.isArray(parsed.items)
    ? parsed.items
        .filter((i: { label?: unknown }) => i && typeof i.label === "string")
        .map((i: Partial<DetectedItem>) => ({
          label: String(i.label),
          category: i.category ? String(i.category) : undefined,
          quantity: Math.max(0, Number(i.quantity) || 1),
          confidence: Math.max(0, Math.min(1, Number(i.confidence) || 0.5)),
          boundingBox: i.boundingBox,
          notes: i.notes ? String(i.notes) : undefined,
        }))
    : [];

  const totalItems =
    typeof parsed.totalItems === "number"
      ? parsed.totalItems
      : items.reduce((sum, i) => sum + i.quantity, 0);

  const overallConfidence =
    typeof parsed.overallConfidence === "number"
      ? parsed.overallConfidence
      : items.length
        ? items.reduce((s, i) => s + i.confidence, 0) / items.length
        : 0;

  return {
    items,
    totalItems,
    overallConfidence,
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : `Detected ${items.length} item type(s), total quantity ${totalItems}.`,
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.map(String)
      : undefined,
    raw,
  };
}

// Text generation helper for insights / summaries
export async function generateInsight(prompt: string): Promise<string> {
  const model = getTextModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateAuditNarrative(input: {
  auditTitle: string;
  location: string;
  totalItems: number;
  matchedItems: number;
  discrepancies: number;
  topMissing: string[];
  topExtra: string[];
}): Promise<string> {
  const prompt = `You are a senior inventory operations analyst. Write a concise (under 120 words) executive summary of the audit results below in clear, professional English. Include risk level and 2 actionable recommendations.

Audit: ${input.auditTitle}
Location: ${input.location}
Total items counted: ${input.totalItems}
Matched: ${input.matchedItems}
Discrepancies: ${input.discrepancies}
Top missing: ${input.topMissing.join(", ") || "none"}
Top extra: ${input.topExtra.join(", ") || "none"}`;
  return generateInsight(prompt);
}
