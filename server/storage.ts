import fs from "node:fs/promises";
import path from "node:path";

const uploadRoot = path.resolve(process.env.UPLOAD_DIR || "uploads");

function normalizeKey(relKey: string) {
  return relKey.replace(/^\/+/, "").replaceAll("..", "_");
}

function appendHashSuffix(relKey: string) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  return lastDot === -1 ? `${relKey}_${hash}` : `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const destination = path.join(uploadRoot, key);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, data);
  return { key, url: `/uploads/${key}` };
}

export async function storageGet(relKey: string) {
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}

export async function storageGetSignedUrl(relKey: string) {
  return `/uploads/${normalizeKey(relKey)}`;
}

export { uploadRoot };
