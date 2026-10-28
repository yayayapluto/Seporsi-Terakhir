/** Klasifikasi hasil pemuat detail porsi: bedakan "nol baris yang sah" dari error nyata. */

export function isMissingColumnError(message: string | null | undefined): boolean {
  if (!message) return false;
  return /ingredient|allergen|column/i.test(message);
}

/** Nol baris maybeSingle (error null) = sah: jangan log. */
export function shouldLogPortionLoadError(error: { message?: string } | null | undefined): boolean {
  return error != null;
}

/** Baris retry tanpa kolom baru → isi null, field lain utuh. */
export function attachMissingIngredientColumns<T extends { menu_items: object }>(row: T) {
  return {
    ...row,
    menu_items: { ...row.menu_items, ingredients: null, allergen_note: null },
  };
}
