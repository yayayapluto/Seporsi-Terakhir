import { getEnv } from "./env";

const BUCKET = "avatars";

/** Public URL avatar dari avatar_url (<user_id>/avatar.jpg). */
export function publicAvatarUrl(avatarPath: string): string {
  return `${getEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${avatarPath}`;
}
