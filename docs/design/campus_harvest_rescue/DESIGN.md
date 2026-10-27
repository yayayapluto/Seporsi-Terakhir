---
name: Campus Harvest & Rescue
colors:
  surface: '#effcf9'
  surface-dim: '#cfddd9'
  surface-bright: '#effcf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e9f7f3'
  surface-container: '#e3f1ed'
  surface-container-high: '#ddebe8'
  surface-container-highest: '#d8e5e2'
  on-surface: '#121e1c'
  on-surface-variant: '#3f4941'
  inverse-surface: '#273331'
  inverse-on-surface: '#e6f4f0'
  outline: '#6f7a70'
  outline-variant: '#bfc9be'
  surface-tint: '#196c40'
  primary: '#0b6438'
  on-primary: '#ffffff'
  primary-container: '#2e7d4f'
  on-primary-container: '#ceffd9'
  inverse-primary: '#88d7a1'
  secondary: '#914d00'
  on-secondary: '#ffffff'
  secondary-container: '#fc9430'
  on-secondary-container: '#663500'
  tertiary: '#4f5953'
  on-tertiary: '#ffffff'
  tertiary-container: '#67716b'
  on-tertiary-container: '#ebf5ed'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a4f4bc'
  primary-fixed-dim: '#88d7a1'
  on-primary-fixed: '#00210f'
  on-primary-fixed-variant: '#00522c'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#dbe5dd'
  tertiary-fixed-dim: '#bfc9c1'
  on-tertiary-fixed: '#151d19'
  on-tertiary-fixed-variant: '#404943'
  background: '#effcf9'
  on-background: '#121e1c'
  surface-variant: '#d8e5e2'
  primary-hover: '#256640'
  primary-light: '#EAF4EC'
  accent-hover: '#DE7819'
  accent-light: '#FEF3E7'
  canvas-background: '#FFFBF5'
  surface-card: '#FFFFFF'
  border-subtle: '#E5E1D8'
  text-muted: '#64746B'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system powers a hyper-local campus food rescue platform anchored in responsible consumption (SDG 12). The brand personality is resourceful, optimistic, energetic, and student-first. It avoids moralizing, sterile institutionalism, or the visual tropes of charity handouts. Instead, the experience frames food rescue as a daily "smart hack": high-value, appetizing meals at discounted prices with an innate sustainability payoff.

The aesthetic blends **Modern Tactile Warmth** with clean **Card-Centric Utility** (inspired by headless modern UI patterns). Interfaces feature airy compositions, crisp warm off-white canvas tones, rounded structural enclosures, and focused chromatic accents that signal immediacy, deliciousness, and freshness without visual clutter.

## Colors

The palette operates in strict **light mode** to sustain a sunlit, clean, and appetizing environment.

- **Primary (#2E7D4F)**: Signals vitality, freshness, and circular sustainability. Reserved for core calls-to-action, active toggles, brand anchors, and confirmation states.
- **Secondary (#F28C28)**: A warm culinary orange engineered for urgency, limited-portion countdowns, discount pill highlights, and real-time alerts. It commands attention without instigating panic.
- **Tertiary / Section Tint (#EAF4EC)**: Soft mint-infused tone for grouping modules, alternating feed segments, and contextual promo banners.
- **Neutral Foreground (#1C2826)**: Deep botanical charcoal that delivers high-contrast readability against the warm canvas while avoiding the clinical harshness of `#000000`.
- **Canvas (#FFFBF5)** & **Surface (#FFFFFF)**: The interplay between cream canvas and elevated white containers establishes clear spatial organization and comfortable visual resting zones.

## Typography

Typography establishes an approachable and modern hierarchy. 

- **Plus Jakarta Sans** governs headings and display metrics. Its rounded geometry and tight kerning generate immediate warmth and a contemporary campus-app spirit.
- **Inter** supports long-form descriptions, price tags, operational metadata, pickup times, and navigational controls, guaranteeing absolute legibility at compact mobile viewports.
- Tracking is subtly tightened on headlines (`-0.02em` to `-0.03em`) to deliver editorial punch and maintain balanced text wrapping on dense handheld displays.

## Layout & Spacing

The layout model is anchored on an 8pt spatial baseline, using fluid mobile-first flex and grid containers.

- **Breakpoints**: Mobile (`<640px`), Tablet (`640px - 1024px`), Desktop (`>1024px`).
- **Mobile Handheld**: 4-column layout with `1rem` outer canvas padding and `1rem` column gutters. Feed items display as single-column vertical stacks or horizontal carousels.
- **Tablet**: 8-column layout with `1.5rem` margins and gutters. Food listings expand into a 2-column card arrangement.
- **Desktop**: 12-column fixed-max layout (`max-w-6xl` or `1200px`), centered with `2rem` margins and `1.5rem` gutters, rendering item grids in a balanced 3-column architecture.

## Elevation & Depth

Visual depth is achieved through layered tonal planes and faint ambient shadows rather than intense elevation drops.

- **Level 0 (Canvas)**: `#FFFBF5` base tone across all root views.
- **Level 1 (Cards & Controls)**: Crisp `#FFFFFF` surfaces paired with a hairline border (`1px solid #E5E1D8`) and ambient shadow: `box-shadow: 0 1px 3px 0 rgba(28, 40, 38, 0.04), 0 1px 2px -1px rgba(28, 40, 38, 0.04)`.
- **Level 2 (Hover & Floating Banners)**: Slight elevation boost: `box-shadow: 0 4px 6px -1px rgba(28, 40, 38, 0.06), 0 2px 4px -2px rgba(28, 40, 38, 0.04)`.
- **Level 3 (Modals, Drawers & Sheets)**: Grounded overlays: `box-shadow: 0 10px 15px -3px rgba(28, 40, 38, 0.08), 0 4px 6px -4px rgba(28, 40, 38, 0.04)` over a semi-opaque backdrop blur (`rgba(28, 40, 38, 0.4)` with `backdrop-filter: blur(4px)`).

## Shapes

The interface embraces organic, friendly contours without descending into novelty:

- **Cards & Sheets**: Structured with `rounded-xl` (`1rem` / `16px`) for an inviting container silhouette.
- **Buttons, Text Inputs & Dropdowns**: Set to `rounded-lg` (`0.5rem` / `8px`) to ensure distinct visual boundaries.
- **Status Badges, Price Chips & Avatars**: Styled with `rounded-full` (`9999px`) for quick scanning.

## Components

Components follow modern component conventions with Radix primitives and Tailwind CSS utility classes.

### Buttons
- **Primary**: Background `#2E7D4F`, text `#FFFFFF`, `rounded-lg`, height `40px` (`h-10 px-4`), semibold typography. Hover state `#256640`. Focused ring offset with `#2E7D4F`.
- **Urgent / Claim**: Background `#F28C28`, text `#FFFFFF`, hover `#DE7819`. Applied to final checkout, countdown grabs, and quick-claim triggers.
- **Secondary / Soft**: Background `#EAF4EC`, text `#2E7D4F`, hover: darker tint `#D7EADC`.
- **Ghost**: Background transparent, text `#1C2826`, hover `#F3EFE6`.

### Cards (Food Item & Vendor)
- Constructed using `bg-white`, `border border-[#E5E1D8]`, `rounded-xl`, and `shadow-sm`.
- Card imagery uses an aspect ratio of `16:10` with top-border radius matching `rounded-t-xl`.
- Footer anchors real-time metadata: original strikethrough price (`#64746B`), rescue price (`#2E7D4F` in bold), and remaining portions badge.

### Chips & Badges
- **Urgency Badge**: `bg-[#FEF3E7] text-[#DE7819] border border-[#FAD8B3] rounded-full px-2.5 py-0.5 text-xs font-semibold`. Used for "Tinggal 2 porsi" or countdown meters.
- **Impact Badge**: `bg-[#EAF4EC] text-[#2E7D4F] border border-[#CDE3D2] rounded-full px-2.5 py-0.5 text-xs font-semibold`. Highlights saved emissions and rescued meals.
- **Filter Chips**: Interactive pills with `rounded-full`. Default is `bg-white border-[#E5E1D8] text-[#1C2826]`; active state turns `bg-[#2E7D4F] text-white border-[#2E7D4F]`.

### Form Inputs & Selects
- Base: `h-10 bg-white border border-[#E5E1D8] rounded-lg px-3 text-sm text-[#1C2826] placeholder-[#64746B]`. Focus style: `outline-none ring-2 ring-[#2E7D4F]/20 border-[#2E7D4F]`.

### Checkboxes & Radios
- Size `18px`, `rounded` (`4px` for checkbox, `rounded-full` for radio), `border-[#E5E1D8]`. Checked state uses `bg-[#2E7D4F] text-white`.

### Lists & Feed Rows
- Divided by hairline borders (`border-b border-[#E5E1D8] last:border-b-0`). Rows use padding `space-md` with gentle background hover (`hover:bg-[#FAF6EF] transition-colors`).

### Countdown & Stock Indicator (Domain Specific)
- Mini-progress bars track available portions (e.g., 3/10 portions remaining). 
- Bar track is `#EAF4EC` with fill in `#F28C28` if under 3 portions, otherwise `#2E7D4F`.