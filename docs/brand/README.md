# RentWise Brand Kit

Everything needed to produce on-brand RentWise work — in Claude, GPT, Figma, code, or with a designer.

## What's here

| Path | What |
|---|---|
| `brand.md` | The full machine-readable brand spec. **Start here.** |
| `logo/` | Fair-Value Gauge symbol (3 color variants), wordmark, horizontal lockup — all SVG |
| `icons/` | 12 UI icons, 24×24, `stroke="currentColor"`, brand stroke style |
| `tokens/` | `tokens.css` (paste into `:root`), `tokens.json`, Tailwind snippet |
| `prompts/` | AI starters: system prompt, tweet, hero, email, error states, photography |

## How to use

- **AI tools**: paste `brand.md` (or `prompts/system-prompt.md`) at the top of a thread, then ask for the asset. Task starters in `prompts/` are pre-scoped.
- **Developers**: import `tokens/tokens.css`, or merge `tokens/tailwind.config.snippet.js` into `tailwind.config`. Fonts: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) · [Reddit Mono](https://fonts.google.com/specimen/Reddit+Mono) · [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans) (all OFL).
- **Which logo where**: favicon/app icon → `logo/symbol-signal-on-ink.svg` · site header on dark → `symbol-mono-paper.svg` + wordmark · print/light surfaces → `symbol-ink-on-paper.svg`, `wordmark.svg`.

## Status / pending

Strategy, identity, voice, logo system, tokens, icons, prompts: **complete**.
Pending Pika reconnect (pika.me agent setup): 15-page guidelines PDF, brand-board previews, generated lifestyle + touchpoint photography, font TTF bundle + zip export.
