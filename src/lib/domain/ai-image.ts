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

/**
 * Petunjuk visual untuk hidangan Indonesia yang namanya sering tidak dikenali
 * model gambar. Urutan penting: yang lebih spesifik didahulukan.
 */
const DISH_HINTS: ReadonlyArray<{ re: RegExp; en: string }> = [
  {
    re: /\bmie ayam\b/i,
    en: "Indonesian chicken noodle dish: yellow egg noodles, shredded chicken, green mustard greens, fried shallots, in a small bowl",
  },
  {
    re: /\bmie goreng\b/i,
    en: "Indonesian fried noodles with vegetables, chicken and sweet soy sauce on a plate",
  },
  { re: /\bbakso|baso\b/i, en: "Indonesian meatball soup with clear broth, noodles and greens" },
  { re: /\bnasi goreng\b/i, en: "Indonesian fried rice with egg, chicken and pickles on a plate" },
  {
    re: /\bnasi padang|rendang\b/i,
    en: "Indonesian rendang beef with coconut curry sauce, rice and vegetables",
  },
  { re: /\bnasi uduk\b/i, en: "Indonesian coconut rice with fried chicken, omelette and sambal" },
  {
    re: /\bsate\b/i,
    en: "Indonesian chicken satay skewers with peanut sauce and sliced shallots",
  },
  {
    re: /\bsoto\b/i,
    en: "Indonesian soto soup with chicken, bean sprouts, egg and clear yellow broth",
  },
  {
    re: /\bgado[- ]?gado|pecel\b/i,
    en: "Indonesian vegetable salad with peanut sauce dressing and rice cake",
  },
  { re: /\bsayur\b|\blodeh\b/i, en: "Indonesian vegetable coconut milk stew in a bowl" },
  {
    re: /\bayam geprek|ayam goreng|ayam bakar\b/i,
    en: "Indonesian fried or grilled chicken with sambal and rice",
  },
  { re: /\bnasi campur\b/i, en: "Indonesian mixed rice plate with several side dishes" },
  { re: /\btempe|tahu\b/i, en: "Indonesian fried tempeh and tofu with sambal" },
  { re: /\bbubur\b/i, en: "Indonesian rice porridge bowl with toppings" },
  { re: /\bpisang goreng\b/i, en: "Indonesian fried banana fritters on a plate" },
  { re: /\bes teh|teh\b/i, en: "glass of Indonesian iced sweet tea with ice cubes" },
  { re: /\bkopi\b/i, en: "glass of Indonesian coffee" },
];

const PHOTO_STYLE =
  "single serving on a ceramic plate, warm natural window light, 45-degree angle, shallow depth of field, realistic food texture, no text, no watermark, no people";

/** Prompt gambar menu: nama menu + deskriptor visual, maks 500 karakter. */
export function buildMenuPrompt(menuName: string): string {
  const name = menuName.trim().replace(/\s+/g, " ").slice(0, 120);
  const hint = DISH_HINTS.find((h) => h.re.test(name))?.en;
  const subject = hint ? `${name} (${hint})` : name;
  const prompt = `Professional food photograph of ${subject}, ${PHOTO_STYLE}.`;
  return prompt.length <= 500 ? prompt : `${prompt.slice(0, 497).trimEnd()}...`;
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
