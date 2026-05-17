/**
 * Minimal RFC-4180-ish CSV parser.
 * Handles quoted fields, escaped quotes (""), CRLF/LF line endings, and trailing newlines.
 * Returns rows as string arrays. Empty rows are filtered out.
 */
export function parseCSV(input: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;

  // Strip UTF-8 BOM if present
  if (input.charCodeAt(0) === 0xfeff) {
    input = input.slice(1);
  }

  while (i < input.length) {
    const c = input[i];

    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      // Treat CRLF and CR as line endings
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      if (input[i] === "\n") i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }

  // Final field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * Parse CSV string into an array of records keyed by header column name.
 * Headers are lower-cased and trimmed.
 */
export function parseCSVToRecords(input: string): Record<string, string>[] {
  const rows = parseCSV(input);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = (row[idx] ?? "").trim();
    });
    return rec;
  });
}
