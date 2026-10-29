import { getEnv } from "./env";

const BUCKET = "menu-images";

/** Public URL foto menu dari image_path (<tenant_id>/<menu_id>.jpg). */
export function publicMenuImageUrl(imagePath: string): string {
  return `${getEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${imagePath}`;
}
