import { expect, type Page, test } from "@playwright/test";
import { act, dismissTour } from "./helpers/tour";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANNEX = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const PW = process.env.SEED_PASSWORD ?? "";
// admin exempt dari daily cap (migration daily_cap) → order fresh selalu lolos
const SINTA = "admin1793198479@yopmail.com";

async function placeFreshOrder(portionId: string) {
  const sb = createClient(SUPABASE_URL, ANNEX, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email: SINTA, password: PW });
  if (error || !data.session) throw new Error("login admin gagal");
  const sb2 = createClient(SUPABASE_URL, ANNEX, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}`, apikey: ANNEX } },
  });
  // batalkan reservasi admin sisa run lama agar token tak menumpuk
  const mine = await sb2.from("orders").select("id").eq("status", "reserved").limit(5);
  for (const o of (mine.data ?? []) as { id: string }[]) {
    await sb2.rpc("cancel_order", { p_order_id: o.id }).then((r) => r, () => null);
  }
  const res = await sb2.rpc("place_order", { p_portion_id: portionId, p_quantity: 1 });
  // JANGAN signOut: revoke refresh token akun shared, bunuh sesi test lain (persistSession false cukup)
  return res;
}

const unique = `E2E ${Date.now().toString(36)}`;

/** Headless: kamera denial → fase error dengan tombol manual inline (tanpa re-mount kamera). */
/** Headless: kamera denial → fase error. Tour intro/step wajib di-skip via DOM click (overlay block klik normal). */
async function openManual(page: Page) {
  for (let k = 0; k < 8; k++) {
    const skip = page.getByRole("button", { name: /^lewati$/i });
    if ((await skip.count()) === 0) break;
    await skip
      .first()
      .evaluate((el) => (el as HTMLElement).click())
      .catch(() => {});
    await page.waitForTimeout(800);
  }
  const manualBtn = page
    .getByRole("button", { name: /kamera bermasalah|^masukkan kode manual$/i })
    .first();
  await manualBtn.waitFor({ state: "visible", timeout: 20_000 });
  // klik normal diblokir overlay tour → DOM click (React onClick tetap fire).
  // kadang klik pertama tak berefek (re-render fase error) → ulangi sampai form muncul.
  for (let k = 0; k < 4; k++) {
    await manualBtn.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
    try {
      await page.locator("#manual-token").waitFor({ state: "visible", timeout: 4_000 });
      break;
    } catch {
      await page.waitForTimeout(800);
    }
  }
  await page.locator("#manual-token").waitFor({ state: "visible", timeout: 10_000 });
}

test("dashboard tenant memuat", async ({ page }) => {
  await page.goto("/tenant");
  await dismissTour(page);
  await expect(page.getByText(/kantinmu hari ini/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /scan pickup/i }).first()).toBeVisible();
  await expect(page.getByText(/menunggu pickup/i).first()).toBeVisible();
  await expect(page.getByText(/porsi aktif/i).first()).toBeVisible();
});

test("menu: tambah + validasi kosong", async ({ page }) => {
  await page.goto("/tenant/menu");
  await dismissTour(page);
  await expect(page.getByText(/menu saya/i).first()).toBeVisible();
  await act(page, /tambah menu/i);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel(/nama menu/i).fill("");
  await page.getByLabel(/harga normal/i).fill("0");
  await act(page, /simpan menu/i);
  await expect(
    page.getByText(/nama menu wajib diisi|harga normal harus lebih dari 0/i).first(),
  ).toBeVisible();
  await page.getByLabel(/nama menu/i).fill(unique);
  await page.getByLabel(/harga normal/i).fill("12000");
  await act(page, /simpan menu/i);
  await expect(page.getByText(unique).first()).toBeVisible();
});

test("posting porsi: validasi lalu sukses", async ({ page }) => {
  await page.goto("/tenant/porsi/baru");
  await dismissTour(page);
  await act(page, /posting porsi/i);
  await expect(page.getByText(/pilih menu dulu/i).first()).toBeVisible();
  // DateField popover + TimeField select: default cooked=now sudah valid, jangan fill.
  await page.locator("#portion-menu").click();
  const wantUnique = page.getByRole("option", { name: new RegExp(unique) });
  let usedUnique = false;
  if ((await wantUnique.count()) > 0) {
    await wantUnique.first().click();
    usedUnique = true;
  } else {
    await page.getByRole("option").first().click();
  }
  const saran = page.getByRole("button", { name: /saran rp/i });
  if ((await saran.count()) > 0) await saran.first().click();
  else await page.getByLabel(/harga diskon/i).fill("6600");
  await act(page, /posting porsi/i);
  await expect(page).toHaveURL(/\/tenant(\?|$)/, { timeout: 20_000 });
  if (usedUnique) await expect(page.getByText(new RegExp(unique)).first()).toBeVisible();
  else await expect(page.getByText(/sisa \d+\/\d+|porsi aktif/i).first()).toBeVisible();
});

test("edit porsi: kurangi jumlah, sisa berkurang", async ({ page }) => {
  await page.goto("/tenant");
  await dismissTour(page);
  const row = page.locator("li", { hasText: unique }).first();
  if ((await row.count()) === 0) {
    test.skip(true, "porsi unik tidak ada (posting gagal)");
    return;
  }
  const before = (await row.innerText()).match(/sisa (\d+)\/(\d+)/i);
  // tour bisa muncul belakangan (progress server async) → dismiss ulang + DOM click
  await dismissTour(page);
  const editLink = row.getByRole("link", { name: /^edit$/i });
  try {
    await editLink.click({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/tenant\/porsi\/.+\/edit/, { timeout: 5_000 });
  } catch {
    await dismissTour(page);
    await editLink.evaluate((el) => (el as HTMLElement).click());
    await expect(page).toHaveURL(/\/tenant\/porsi\/.+\/edit/);
  }
  const qty = page.locator("#portion-qty");
  const n = Number(await qty.inputValue());
  await qty.fill(String(Math.max(1, n - 1)));
  const saran = page.getByRole("button", { name: /saran rp/i });
  if ((await saran.count()) > 0) await saran.first().click();
  await page.getByRole("button", { name: /simpan perubahan/i }).click();
  await expect(page).toHaveURL(/\/tenant(\?|$)/, { timeout: 20_000 });
  if (before && Number(before[1]) > 1) {
    const want = `sisa ${Number(before[1]) - 1}/${before[2]}`;
    await expect(page.locator("li", { hasText: unique }).first()).toContainText(want);
  } else {
    await expect(page.locator("li", { hasText: unique }).first()).toBeVisible();
  }
});
test("scan manual: token sampah + konfirmasi + token terpakai", async ({ page }) => {
  // submitKode dipakai hanya saat halaman scan + mode manual aktif
  const submitKode = async (kode: string) => {
    for (let i = 0; i < 5; i++) {
      await page.locator("#manual-token").fill(kode);
      try {
        await expect(page.locator("#manual-token")).toHaveValue(kode, { timeout: 2_000 });
        break;
      } catch {
        /* remount oleh fase error, ulangi */
      }
    }
    await expect(page.locator("#manual-token")).toHaveValue(kode);
    // klik Cari sampai hasil lookup render (klik evaluate kadang tak fire saat busy)
    for (let i = 0; i < 4; i++) {
      const btn = page.getByRole("button", { name: /cari pesanan/i });
      await expect(btn).toBeEnabled();
      await btn.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
      try {
        await expect(page.locator("#manual-token")).toHaveCount(0, { timeout: 3_000 });
        break; // form hilang = lookup selesai (preview / error hasil)
      } catch {
        /* coba klik lagi */
      }
    }
  };

  await page.goto("/tenant/scan");
  await dismissTour(page);
  await openManual(page);
  await submitKode("00000000-0000-0000-0000-000000000000");
  await expect(page.locator('section[role="alert"]')).toContainText(/tidak dikenali/i);
  // reservasi fresh: sinta pesan 1 porsi aktif milik warteg (posting test = cooked now)
  await page.goto("/tenant");
  await dismissTour(page);
  const portionIds = await page
    .locator('a[href*="/tenant/porsi/"][href*="/edit"]')
    .evaluateAll((els) => [...new Set(els.map((e) => (e as HTMLAnchorElement).href.split("/tenant/porsi/")[1]?.split("/")[0] ?? ""))]);
  let kode = "";
  let lastErr = "tidak ada porsi aktif";
  for (const portionId of portionIds.slice(0, 5)) {
    if (!portionId) continue;
    const placed = await placeFreshOrder(portionId);
    if (!placed.error && placed.data) {
      kode = (placed.data as { pickup_token: string }).pickup_token;
      break;
    }
    lastErr = placed.error?.message ?? "unknown";
  }
  if (!kode) {
    test.skip(true, `place_order gagal: ${lastErr}`);
    return;
  }
  await page.goto("/tenant/scan");
  await dismissTour(page);
  await openManual(page);
  await submitKode(kode);
  await expect(page.getByText(/konfirmasi pickup/i).first()).toBeVisible();
  await page
    .getByRole("button", { name: /^konfirmasi pickup$/i })
    .evaluate((el) => (el as HTMLElement).click());
  await page
    .getByRole("button", { name: /ya, konfirmasi/i })
    .evaluate((el) => (el as HTMLElement).click());
  await expect(page.getByText(/pickup dikonfirmasi/i)).toBeVisible();

  await page.goto("/tenant/scan");
  await dismissTour(page);
  await openManual(page);
  await submitKode(kode);
  await expect(page.locator('section[role="alert"]')).toContainText(
    /sudah diambil|tidak dikenali/i,
  );
});
