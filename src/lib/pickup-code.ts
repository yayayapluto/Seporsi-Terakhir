/** Klasifikasi input pickup: QR berisi uuid token, ketik manual 4 digit. */
export type PickupInput = { kind: "token"; value: string } | { kind: "code"; value: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_RE = /^[0-9]{4}$/;

export function classifyPickupInput(raw: string): PickupInput | null {
  const value = raw.trim();
  if (UUID_RE.test(value)) return { kind: "token", value: value.toLowerCase() };
  if (CODE_RE.test(value)) return { kind: "code", value };
  return null;
}
