/** Only internal redirect targets are allowed after login. */
export function isSafeNext(value: string | null | undefined): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes("\n") &&
    !value.includes("\r")
  );
}

/** Resolve the post-login target: safe `next`, else the role home. */
export function resolveNext(next: string | null | undefined, roleHome: string): string {
  return isSafeNext(next) ? next : roleHome;
}
