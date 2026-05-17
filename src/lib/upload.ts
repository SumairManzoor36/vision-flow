import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");

export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function saveImageFromDataUrl(dataUrl: string): Promise<{
  filename: string;
  publicPath: string;
  mimeType: string;
  size: number;
}> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");

  const mimeType = match[1];
  const base64 = match[2];
  const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
  const buffer = Buffer.from(base64, "base64");

  const maxBytes = (Number(process.env.MAX_UPLOAD_MB) || 20) * 1024 * 1024;
  if (buffer.byteLength > maxBytes) {
    throw new Error(`Image too large (max ${maxBytes / 1024 / 1024}MB)`);
  }

  await ensureUploadDir();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const fullPath = path.join(UPLOAD_DIR, filename);
  await writeFile(fullPath, buffer);

  return {
    filename,
    publicPath: `/uploads/${filename}`,
    mimeType,
    size: buffer.byteLength,
  };
}

export function dataUrlToBase64(dataUrl: string): { base64: string; mimeType: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  return { mimeType: match[1], base64: match[2] };
}
