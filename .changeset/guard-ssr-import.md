---
"@klappay/one": patch
---

Fix `@klappay/one` and `@klappay/one/react` throwing when imported anywhere Node evaluates them (SSR, static generation, prerendering in Next.js/Nuxt/SvelteKit/etc.) — `registerKlappayButton()` now no-ops instead of crashing when `HTMLElement`/`customElements` don't exist.
