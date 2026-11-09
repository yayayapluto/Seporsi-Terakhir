import AxeBuilder from "@axe-core/playwright";
import { type ConsoleMessage, expect, type Page } from "@playwright/test";

/** Cair: { documentElement.scrollWidth <= innerWidth, tidak ada elemen meluber kanan > 1px */
export async function expectNoHorizontalOverflow(page: Page) {
  const ok = await page.evaluate(() => {
    const vw = window.innerWidth;
    if (document.documentElement.scrollWidth > vw + 1) return false;
    const els = [...document.querySelectorAll("body *")].filter((e) => {
      const el = e as HTMLElement;
      return el.offsetParent !== null || el instanceof HTMLImageElement;
    });
    return els.every((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      return r.right <= vw + 1 && r.left >= -1;
    });
  });
  expect(ok).toBe(true);
}

/** Kartu/ubun saudara tidak bersinggungan. */
export async function expectNoOverlap(
  locators: { name: string; locator: ReturnType<Page["locator"]> }[],
) {
  const boxes = await Promise.all(
    locators.map(async (l) => ({
      name: l.name,
      box: await l.locator.first().boundingBox(),
    })),
  );
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]?.box;
      const b = boxes[j]?.box;
      if (!a || !b) continue;
      const overlap =
        a.x < b.x + b.width - 1 &&
        b.x < a.x + a.width - 1 &&
        a.y < b.y + b.height - 1 &&
        b.y < a.y + a.height - 1;
      expect.soft(overlap, `overlap: ${boxes[i]?.name} x ${boxes[j]?.name}`).toBe(false);
    }
  }
}

async function visibleInteractives(page: Page) {
  return page.locator("button:visible, a[href]:visible, select:visible, [role=button]:visible");
}

/** Semua tombol/link/select/nav target sentuh >= 44x44 di mobile. */
export async function expectTapTargets(page: Page, selector?: string) {
  const loc = selector ? page.locator(selector) : await visibleInteractives(page);
  const count = await loc.count();
  for (let i = 0; i < count; i++) {
    const el = loc.nth(i);
    if (!(await el.isVisible())) continue;
    const box = await el.boundingBox();
    if (!box) continue;
    const name = ((await el.textContent()) ?? "").trim().slice(0, 40) || el.evaluate?.toString();
    expect
      .soft(
        Math.min(box.width, box.height),
        `tap target terkecil: ${name || (await el.getAttribute("aria-label")) || el.evaluate?.toString()}`,
      )
      .toBeGreaterThanOrEqual(44);
  }
}

/** Setiap button/[role=button] terluar punya border terlihat (tangkap ghost terlarang). Tab/switch/checkbox dilewati. */
export async function expectButtonsOutlined(page: Page) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    const els = [...document.querySelectorAll("button, [role=button]")];
    for (const e of els) {
      const el = e as HTMLElement;
      if (el.offsetParent === null && !(el instanceof SVGElement)) continue;
      if (
        el.getAttribute("role") === "tab" ||
        el.getAttribute("role") === "switch" ||
        el.getAttribute("role") === "checkbox"
      )
        continue;
      const cs = getComputedStyle(el);
      const borderWidth = Number.parseFloat(cs.borderTopWidth);
      const color = cs.borderTopColor;
      const name = (el.getAttribute("aria-label") ?? el.textContent ?? "")
        .toString()
        .trim()
        .slice(0, 40);
      if (borderWidth === 0 || color === "rgba(0, 0, 0, 0)" || color === "transparent") {
        out.push(name || el.tagName);
      }
    }
    return out;
  });
  expect.soft(bad, "tombol tanpa outline").toEqual([]);
}

export async function expectSelectShowsLabel(
  page: Page,
  trigger: ReturnType<Page["getByLabel"]>,
  expectedLabel: string,
) {
  await expect(trigger).toContainText(expectedLabel);
}

export async function expectNoSkeletonLeft(page: Page) {
  await expect(page.locator("[data-slot=skeleton], .animate-pulse")).toHaveCount(0);
}

export async function expectNoSpinnerText(page: Page) {
  await expect(page.getByText(/memuat|loading/i)).toHaveCount(0);
}

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

export async function expectNoConsoleErrors(page: Page, errors: string[]) {
  await expect.poll(() => errors, { timeout: 2_000 }).toEqual([]);
}

export async function expectA11y(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    bad.map((v: { id: string }) => v.id),
    "axe serious/critical",
  ).toEqual([]);
}

export async function expectFontsAtLeast(page: Page, min = 12) {
  const small = await page.evaluate((m: number) => {
    const out: string[] = [];
    for (const el of [...document.querySelectorAll("body *")]) {
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const fs = Number.parseFloat(getComputedStyle(el).fontSize);
      if (fs < m && el.textContent?.trim()) out.push(`${el.tagName}:${fs}px`);
    }
    return out.slice(0, 5);
  }, min);
  expect.soft(small, "font terlalu kecil").toEqual([]);
}

export async function expectInputs16px(page: Page) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of [...document.querySelectorAll("input, select, textarea")]) {
      const fs = Number.parseFloat(getComputedStyle(el as Element).fontSize);
      if (fs < 16) out.push(`${(el as HTMLElement).tagName}:${fs}px`);
    }
    return out;
  });
  expect.soft(bad, "input < 16px di mobile").toEqual([]);
}
