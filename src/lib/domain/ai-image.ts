import { createHash } from "node:crypto";

/** Domain murni untuk generate gambar AI menu — tanpa I/O. */

export const AI_IMAGE_MODELS = ["sdxl", "flux"] as const;
export type AiImageModel = (typeof AI_IMAGE_MODELS)[number];

export const AI_IMAGE_DEFAULT_MODEL: AiImageModel = "sdxl";

export const AI_IMAGE_SIZE = { w: 1024, h: 768 };

export const AI_IMAGE_DAILY_QUOTA = 3;

export const HF_MODEL_IDS: Record<AiImageModel, string> = {
  sdxl: "stabilityai/stable-diffusion-xl-base-1.0",
  flux: "black-forest-labs/FLUX.1-schnell",
};

/** sha256 hex dari `prompt|model|1024x768`. */
export function hashPrompt(prompt: string, model: string): string {
  return createHash("sha256")
    .update(`${prompt}|${model}|${AI_IMAGE_SIZE.w}x${AI_IMAGE_SIZE.h}`)
    .digest("hex");
}

/** Status yang layak di-retry. 400/422 (prompt ditolak) tidak pernah. */
export function isRetriableStatus(status: number): boolean {
  return status === 429 || status === 503;
}

/** Legacy anonymous Pollinations (tanpa key). */
export function buildPollinationsUrl(prompt: string, seed: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${AI_IMAGE_SIZE.w}&height=${AI_IMAGE_SIZE.h}&seed=${seed}&nologo=true&model=flux`;
}

/** Placeholder SVG data URL: gradasi + inisial label. Tidak pernah gagal. */
export function buildPlaceholderSvg(label: string): string {
  const initials = label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${AI_IMAGE_SIZE.w}" height="${AI_IMAGE_SIZE.h}" viewBox="0 0 ${AI_IMAGE_SIZE.w} ${AI_IMAGE_SIZE.h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#2E7D4F"/><stop offset="1" stop-color="#F28C28"/></linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/>` +
    `<text x="50%" y="54%" text-anchor="middle" font-family="sans-serif" font-size="220" font-weight="700" fill="#FFFFFF">${initials || "?"}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
