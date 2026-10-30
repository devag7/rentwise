# RentWise design system

Apple-inspired, grounded in Apple's Human Interface Guidelines and WWDC
"Designing Fluid Interfaces", plus Emil Kowalski's design-engineering rules.
Tokens and utilities live in `src/app/globals.css`; primitives in
`src/components/ui/`.

**Thesis:** RentWise is the honest price tag for a Bangalore flat. Every screen
answers one question: *what is this flat really worth?*

**Signature:** the market bar (`MarketBar`): a flat's rent drawn against its
real market (typical range, median, the rent itself). Everything around it stays quiet.

## Principles

1. **Content first, chrome quiet.** White/black surfaces, one accent colour for
   actions, colour otherwise reserved for the verdict.
2. **One colour, one meaning.** `accent` = tap/click. `good` = under market.
   `bad` = over market (and destructive). Never decorative.
3. **System type.** SF on Apple devices, Segoe/Roboto elsewhere. No web font.
   Hierarchy from size + weight + leading together; no ALL CAPS, no wide tracking.
4. **Follows the OS.** Light and dark come from `prefers-color-scheme`. No
   theme toggle. Reduced motion, reduced transparency and increased contrast are handled.
5. **Honest data.** Never show a number or verdict without ≥3 real comparables
   (`MIN_COMPS`). Empty states say what's missing and what to do.

## Colour tokens (Tailwind names)

| Token | Use | Light | Dark |
| --- | --- | --- | --- |
| `surface` | page | #fff | #000 |
| `surface-2` | alternating sections, grouped backgrounds | #f5f5f7 | #101012 |
| `surface-3` | cards (via `.card`) | #fff | #1c1c1e |
| `fill` / `fill-strong` | control backgrounds, hover rows, tracks | grey 12% / 20% | grey 24% / 36% |
| `separator` | hairlines | black 10% | white 14% |
| `label` | primary text | #1d1d1f | #f5f5f7 |
| `label-2` | secondary text (≥4.5:1) | #6e6e73 | #a1a1a6 |
| `label-3` | tertiary: placeholders, large/non-essential only | #86868b | #6e6e73 |
| `accent` | buttons, links, focus | #0071e3 | #2997ff |
| `good` | under market, success | #1a7f37 | #30d158 |
| `bad` | over market, errors, destructive | #d70015 | #ff453a |
| `warn` | caution | #b25000 | #ff9f0a |

Use as `bg-surface-2`, `text-label-2`, `border-separator`, `bg-good/12`, and so on.
**Never** hard-code hex colours in components.

## Type scale (utilities)

| Class | Size | Use |
| --- | --- | --- |
| `text-display` | 40→80px, 700, −0.028em | one per page max (home hero) |
| `text-title-1` | 32→48px, 700 | page `h1` / section headlines |
| `text-title-2` | 24→32px, 600 | section `h2` |
| `text-title-3` | 21px, 600 | card titles, prices |
| `text-headline` | 17px, 600 | list row titles, emphasis |
| `text-lead` | 19→24px | intro paragraph under a title |
| body (default) | 17px / 1.47 | paragraphs |
| `text-callout` | 15px | dense secondary text |
| `text-footnote` | 13px | metadata, nav links |
| `text-caption` | 12px | chips, axis labels (minimum size) |
| `text-eyebrow` | 13px 600 label-2 | small kicker above a hero title, sparingly |

Add `num` (tabular figures) to every price, count and percentage. Use
`text-balance` on headings. Keep paragraphs ≤ ~65ch (`max-w-2xl`).

## Components & classes

- **Layout:** `<Container>` (max-w-6xl, 20px gutters) or `<Container narrow>`
  (max-w-3xl) for forms/text. The navbar is fixed and 56px tall: page tops use
  `pt-28 sm:pt-32` (hero pages `pt-32 sm:pt-40`). Sections: `py-20 sm:py-28`,
  alternate `bg-surface` / `bg-surface-2`. Pages render inside the layout's
  `<main>`, so **don't add another `<main>`**; use `<div>`/`<section>`.
- **Buttons:** `btn btn-primary` (one per view, the main action), `btn btn-secondary`,
  sizes `btn-sm` / default / `btn-lg`. Pills, min 44px tall. Press = scale(0.97).
  Text links: `link` or `link link-chevron` ("Browse flats ›") for secondary navigation.
  Destructive: `btn btn-secondary text-bad`.
- **Cards:** `card` (surface-3, 18px radius, soft shadow). Clickable cards add
  `pressable` (press scale + hover lift). Large panels: `rounded-[var(--radius-panel)]`.
- **Forms:** `field` on inputs/selects/textareas, `field-label` on labels. Every
  input has a visible label. Errors in `text-bad text-footnote` under the field.
- **Lists:** `card divide-y divide-separator overflow-hidden`; rows `px-5 py-4`,
  hover `hover:bg-fill`, trailing `›` in `text-label-3`.
- **Chips / badges:** `chip` (neutral). Verdicts always via `<VerdictPill>`.
- **Segmented controls** (filters, tabs): a `bg-fill rounded-full p-1` track with
  `rounded-full px-3 py-1.5 text-footnote` items; selected = `bg-surface-3 shadow-card text-label font-semibold`.
- **Market data:** `<MarketBar median p25 p75 rent? count?>` whenever a median and
  range are shown; `<VerdictPill verdict>` for under/at/over.
- **Translucent chrome:** `material` (blur + saturate). Only for floating layers
  (navbar, sticky bars, overlays on images), never for content cards.
- **Empty states:** centered, `text-title-3` + one `text-label-2` sentence + one action.
- **Icons:** inline SVG, stroke 1.6–2, `currentColor`, sized to adjacent text. Icon-only
  buttons get `aria-label` and a ≥36px hit area.

## Motion

Curves: `--ease-out` (enter / most UI), `--ease-in-out` (on-screen movement),
`--ease-drawer` (sheets). Durations: press 160ms, small UI 200ms, panels 250ms.
Write `ease-[var(--ease-out)]` in Tailwind.

- Animate only `transform` and `opacity` (blur ≤ 20px if needed). Never `transition-all`.
- Never animate from `scale(0)`; start at `scale(0.95–0.98)` + `opacity: 0`.
- Menus/popovers grow from their trigger (`origin-top-right` etc.); modals stay centered.
- Frequently used UI (filters, list navigation, typing) has **no** entrance animation.
- `<Reveal>` (fade + 16px lift, once) is for **marketing sections only** (home,
  landing sections), with 50–80ms stagger. Never on dashboards, forms or lists people use daily.
- `.pop-in` gives small surfaces (menus, inline results) a CSS `@starting-style` entrance.
- Hover effects only for `(hover: hover)` devices (Tailwind v4 `hover:` already is).
- Reduced motion: transforms removed, opacity kept (handled globally).

## Copy

Plain, specific, sentence case. Buttons say what happens ("Check a rent",
"Save flat", "Send application"), never "Submit" or "Initialize". No jargon
("Authenticate session", "registry"). Errors say what went wrong and how to fix it.
Numbers: `formatINR`, "/mo", "sq ft", tabular figures.
