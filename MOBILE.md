# Mobile shell patterns (360–430px)

Apply **mobile-only** behavior via `max-md:` variants (Tailwind `max-md:` = max-width 819px here). **Never edit or remove an existing desktop class.** Mobile-only components (bottom nav, sheets) use `hidden` / `max-md:hidden` toggles.

Already done at shell level — do NOT re-add: viewport meta, safe-area `main` padding under bottom nav, bottom nav (72px, radius 24), AppHeader 64px mobile with wordmark on main tabs + back on children.

## Tokens
- Fonts: `font-heading` (Plus Jakarta Sans) headings; `font-sans` (Inter) body.
- Colors: primary `#286f3b`, dark `#1E5A36`, text `#1C2826`, muted `#64746B`, border `#e3e9e5`/`--line`, tint `#dcebe0`/`#e6f4ea`, amber `#b45309`/soft `#fef3c7`, danger `#ba1a1a`/soft `#fee2e2`.
- Card radius 16–20, button radius 12. Tap targets ≥ 44px, ≥ 8px apart. Body ≥ 14px, h1 28px (`text-3xl`). Inputs 16px (`text-base`).

## Route-level mobile work
- Page padding-x 20 (`px-5` on mobile, keep existing `md:px-6/8`), section gap 24.
- **Lists**: single-column; compact filters (2 selects side by side, or horizontally-scrolling chip row); actions in card footer.
- **Tables → stacked cards** (label: value rows, actions at bottom). Example: `admin/impact-client.tsx` `<table>` → wrap desktop table in `max-md:hidden`, render a stacked-card list with `md:hidden`.
- **Dashboards**: stat rows (icon, label, value right); numbers never truncated (wrap, no `truncate`). Charts full width, 180–220px high.
- **Forms**: one column, labels above, 48px inputs, sticky full-width submit **above** bottom nav (sticky container with `pb-[calc(...)]`).
- **Detail pages**: back + title; primary action sticky at bottom.
- **QR / scanner**: QR ≥ 240px centered on white; scanner fullscreen with 44px close; result in bottom sheet.
- **Modals / dropdowns**: bottom sheets — use existing `Sheet side="bottom"` or `FormSheet` (already mobile-sheet/desktop-dialog). radius-top 24, `max-h-[85dvh]`, internal scroll, primary action at bottom.
- **Empty states**: `#f6f8f6` card with icon, title, short text, one button (`SieraEmpty`).
- **Toasts**: above bottom nav, full width minus 24px.
- **Landing & login**: one column, **no bottom nav** (already the case — `useInAppPath` excludes `/` and `/masuk`).
- **Right-hand desktop panels** (`SieraRailPage` aside): already stack below main below `xl`. Ensure nothing is sticky on mobile.
- No horizontal scroll, no `truncate` ellipsis on text (wrap). Badges may drop to own line.
- `:active` and `focus-visible` states on everything; `aria-label` on icon buttons.

## Images
- `next/image` with explicit `sizes` and `aspect-ratio` on every photo area (mobile widths ~360–430).

## Quality
Run `bun run check` + `bun run build` before every commit. Desktop `git diff` must show only **additions** with `max-md:`/`md:` — never a removed/edited desktop class line.