import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { SEED_ACCOUNTS } from "@/lib/domain/seed-accounts";

/**
 * DEV-ONLY. Dirender dari page.tsx hanya bila NODE_ENV !== "production".
 * Link GET ke /api/dev/login (bukan form password) agar SEED_PASSWORD
 * tidak pernah menyentuh browser. Disembunyikan total di production.
 */
export function DevLoginCard({ next }: { next?: string }) {
  const qs = next ? `&next=${encodeURIComponent(next)}` : "";
  const picks = [
    SEED_ACCOUNTS.find((a) => a.role === "admin"),
    SEED_ACCOUNTS.find((a) => a.role === "tenant"),
    SEED_ACCOUNTS.find((a) => a.role === "student"),
  ].filter((a) => a !== undefined);
  return (
    <div className="rounded-[20px] border border-dashed border-line bg-muted/50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <FlaskConical className="size-3.5" aria-hidden />
        Khusus development, pintasan login tanpa email
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {picks.map((a) => (
          <li key={a.email}>
            <Link
              className="flex min-h-11 items-center justify-between rounded-xl border border-line bg-card px-3 text-sm"
              href={`/api/dev/login?email=${encodeURIComponent(a.email)}${qs}`}
            >
              <span className="font-medium">{a.fullName}</span>
              <span className="text-xs text-muted-foreground">{a.role}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
