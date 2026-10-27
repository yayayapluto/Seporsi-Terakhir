import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "tenant" | "admin";

export interface CurrentUser {
  user: User;
  role: Role;
}

/**
 * Current signed-in user + role from profiles. Null when anonymous or when
 * the profile row is missing (e.g. brand-new signup before trigger runs).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (data?.role ?? null) as Role | null;
  if (role !== "student" && role !== "tenant" && role !== "admin") return null;
  return { user, role };
}

/** Home path per role after login. */
export function homeForRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "tenant":
      return "/tenant";
    case "student":
      return "/katalog";
  }
}

/**
 * Require one of the given roles. Anonymous users go to /masuk with `next`
 * (the protected path being accessed, so login can return there); wrong-role
 * users go to their own home. Returns the user on success.
 */
export async function requireRole(next: string, ...roles: Role[]): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) redirect(`/masuk?next=${encodeURIComponent(next)}`);
  if (!roles.includes(current.role)) redirect(homeForRole(current.role));
  return current;
}
