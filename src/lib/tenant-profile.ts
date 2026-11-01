import { z } from "zod";

/** Validasi form profil kantin (nama gerai + catatan lokasi). */
export const TenantProfileSchema = z.object({
  name: z.string().trim().min(1, "Nama gerai wajib diisi.").max(80, "Nama maksimal 80 karakter."),
  locationNote: z
    .string()
    .trim()
    .max(200, "Lokasi maksimal 200 karakter.")
    .nullable()
    .optional()
    .transform((v) => (v == null || v === "" ? null : v)),
});

export type TenantProfileInput = z.input<typeof TenantProfileSchema>;

/** Samakan dengan server: trim nama, lokasi blank jadi null. */
export function normalizeTenantProfile(input: TenantProfileInput): {
  name: string;
  locationNote: string | null;
} {
  const name = input.name.trim();
  const loc = (input.locationNote ?? "").trim();
  return { name, locationNote: loc === "" ? null : loc };
}
