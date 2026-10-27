# Porsi Terakhir — Product Brief

Hyper-local web app (MVP prototype, opt-in pilot at one campus). Willing canteen
tenants sell end-of-day leftover cooked food ("Porsi Terakhir Hari Ini") at a
discount; students order, get a QR, pick up on foot, and pay on the spot
(cash/QRIS — the system does **not** process payments). Every scanned pickup is
recorded as verifiable impact data (SDG 12).

## Roles

- **student** (mahasiswa): browse catalog, order, QR pickup, profile + badges.
- **tenant** (opt-in, must be approved by admin): post portions (3 inputs: menu,
  quantity, cook time; discount price auto-suggested), scan buyer QR, see order status.
- **admin** (BEM / campus unit): impact dashboard + downloadable report.

## Core rules (enforced server-side, never only in UI)

- BR-1: only cooked, storable food may be posted.
- BR-2: a portion may be sold for at most 2–4 hours after cook time (agreed with
  tenant; configurable per portion within 120–240 min, default 180). Expired
  portions must not be orderable nor shown as available.
- BR-3: cook time is mandatory and visible to buyers.
- BR-4/5: tenant is responsible for quality; main ingredients and allergens are
  shown when filled.
- BR-6: discount price is estimated at 40–50% of normal price, above ingredient
  cost; the system only *suggests* it, tenant may edit. Interpretation: use
  midpoint 45%, rounded to nearest Rp500 (see `src/lib/domain/constants.ts`).
- BR-7: platform fee is zero during pilot.
- BR-8: strictly opt-in; no forced participation.
- Tenant adds a portion in max 3 taps; normal price per menu item is set once
  per tenant.

## Functional requirements

P0 (MVP):
- Catalog (FR-01..03): active portions with menu, discount price, remaining
  quota, cook time; filter by tenant; detail page with ingredients/allergens.
- Ordering (FR-04..07): order reduces quota; QR pickup + pickup slot + visible
  status; pay at pickup; profile with history and personal impact badge.
- Tenant (FR-10..14): 3-input form, price suggestion, release schedule, scan
  buyer QR to confirm pickup, tenant dashboard.
- Admin (FR-16..18): impact dashboard and periodic report download (CSV).
- Transparency (FR-19..20): "Cara Kerja" page (baseline, formulas, food-safety
  SOP, opt-in principle); landing page that explains value and lets the user
  choose a role.

P1 (later, do NOT build now): push notifications (FR-08), faculty leaderboard
(FR-09), tenant waste-trend insight (FR-15).

## Impact metrics

- Portions saved = count of scanned pickups.
- Food waste prevented (kg) = portions sold × average weight per menu (from sample weighing).
- Student money saved = (normal price − discount price) × portions.
- Extra tenant revenue = total transaction value of picked-up portions.
- % of leftovers sold = portions sold / portions posted.

## Screens (9)

Landing/Onboarding, Student Catalog, Portion Detail, QR Pickup, Profile &
Badges, Tenant Dashboard, Add Portion Form (3 taps), Campus Impact Dashboard,
Cara Kerja.
