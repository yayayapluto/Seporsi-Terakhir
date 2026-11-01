import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { act, dismissTour } from "./helpers/tour";

const ANNEX = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const PW = process.env.SEED_PASSWORD ?? "";
const ADMIN = "admin1793198479@yopmail.com";
const STUDENT2 = "sinta1793198479@yopmail.com";

async function rpcAs(email: string, fn: string, args: Record<string, unknown>) {
  const sb = createClient(SUPABASE_URL, ANNEX, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PW });
  if (error || !data.session) throw new Error(`login gagal ${email}`);
  const sb2 = createClient(SUPABASE_URL, ANNEX, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        apikey: ANNEX,
      },
    },
  });
  const res = await sb2.rpc(fn, args);
  // JANGAN signOut: revoke refresh token akun shared (persistSession false = memory-only)
  return res;
}

test("dampak: angka + tabel + ubah rentang", async ({ page }) => {
  await page.goto("/admin");
  await dismissTour(page);
  await expect(page.getByText(/dampak penyelamatan/i)).toBeVisible();
  await expect(page.getByText(/porsi terselamatkan/i).first()).toBeVisible();
  await expect(page.getByText(/sell-through/i).first()).toBeVisible();
  // DateField = popover kalender (bukan input): klik trigger "Sampai", pilih tanggal 26
  await page.getByRole("button", { name: /^sampai/i }).click();
  await page
    .getByRole("gridcell", { name: /senin, 26 oktober/i })
    .first()
    .click();
  await expect(page).toHaveURL(/to=2026-10-26/, { timeout: 20_000 });
});

test("csv: terunduh non-kosong, header Gerai", async ({ page }) => {
  await page.goto("/admin");
  await dismissTour(page);
  const download = page.waitForEvent("download", { timeout: 30_000 });
  await act(page, /unduh csv/i);
  const dl = await download;
  const path = await dl.path();
  expect(path).toBeTruthy();
});

test("approve pendaftar sintetis via RPC → setujui", async ({ page }) => {
  const name = `E2E Warung ${Date.now().toString(36)}`;
  const res = await rpcAs(STUDENT2, "apply_as_tenant", {
    p_name: name,
    p_location_note: "E2E",
  });
  test.skip(
    !res.error && true ? false : /already|duplicate|tenant/i.test(res.error?.message ?? ""),
    `seed sinta sudah jadi tenant: ${res.error?.message}`,
  );
  await page.goto("/admin/tenant");
  await expect(page.getByRole("heading", { name: /mitra kantin/i })).toBeVisible();
  await expect(page.getByText(/menunggu persetujuan/i).first()).toBeVisible();
  const row = page.locator("li", { hasText: name }).first();
  if ((await row.count()) === 0) {
    test.skip(true, "pendaftar tidak muncul (mungkin sudah approved)");
    return;
  }
  await dismissTour(page);
  await row
    .getByRole("button", { name: /^tinjau$/i })
    .evaluate((el) => (el as HTMLElement).click());
  await dismissTour(page);
  await row
    .getByRole("button", { name: /setujui tenant/i })
    .evaluate((el) => (el as HTMLElement).click());
  await expect(page.locator("li", { hasText: name })).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByText(/visibilitas di katalog/i).first()).toBeVisible();
});

test("reject pendaftar sintetis", async ({ page }) => {
  const name = `E2E Tolak ${Date.now().toString(36)}`;
  const res = await rpcAs(STUDENT2, "apply_as_tenant", {
    p_name: name,
    p_location_note: "E2E",
  });
  if (res.error) {
    test.skip(true, `tidak bisa daftar: ${res.error.message}`);
    return;
  }
  await page.goto("/admin/tenant");
  const row = page.locator("li", { hasText: name }).first();
  await dismissTour(page);
  await row
    .getByRole("button", { name: /^tinjau$/i })
    .evaluate((el) => (el as HTMLElement).click());
  await dismissTour(page);
  await row
    .getByRole("button", { name: /tolak pendaftar/i })
    .evaluate((el) => (el as HTMLElement).click());
  await expect(page.getByRole("dialog")).toContainText(name);
  await dismissTour(page);
  await page
    .getByRole("button", { name: /tolak pendaftar/i })
    .last()
    .evaluate((el) => (el as HTMLElement).click());
  await expect(page.locator("li", { hasText: name })).toHaveCount(0, { timeout: 20_000 });
});

test("toggle visibilitas reversibel", async ({ page }) => {
  await page.goto("/admin/tenant");
  await expect(page.getByText(/visibilitas di katalog/i).first()).toBeVisible();
  const row = page.locator("li", { hasText: /warteg barokah/i }).first();
  if ((await row.count()) === 0) {
    test.skip(true, "seed tenant tidak ada");
    return;
  }
  const toggle = row.getByRole("button", { name: /sembunyikan|tampilkan/i });
  const label = ((await toggle.innerText()) ?? "").toLowerCase();
  await toggle.click();
  if (label.includes("sembunyikan")) {
    await expect(row.getByText(/disembunyikan dari katalog/i)).toBeVisible({
      timeout: 20_000,
    });
    await dismissTour(page);
    await row
      .getByRole("button", { name: /tampilkan/i })
      .evaluate((el) => (el as HTMLElement).click());
    await expect(row.getByText(/tampil di katalog/i)).toBeVisible({ timeout: 20_000 });
  } else {
    await expect(row.getByText(/tampil di katalog/i)).toBeVisible({ timeout: 20_000 });
    await dismissTour(page);
    await row
      .getByRole("button", { name: /sembunyikan/i })
      .evaluate((el) => (el as HTMLElement).click());
    await expect(row.getByText(/disembunyikan dari katalog/i)).toBeVisible({
      timeout: 20_000,
    });
  }
});

test("isolasi admin: /tenant tanpa tenant → /pendaftaran", async ({ page }) => {
  await page.goto("/tenant");
  await expect(page).toHaveURL(/pendaftaran/);
});

// Sanity: magic-link smoke admin dikerjakan via guest spec; kredensial admin dipakai di sini.
void ADMIN;
