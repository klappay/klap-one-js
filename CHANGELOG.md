# @klappay/one

## 1.0.2

### Patch Changes

- af909e6: Fix `KlappayButton` (React) and any JSX-rendered `<klappay-button>` crashing when passed `variant`/`size`. React sets custom-element props as DOM properties when a matching property already exists on the element — `KlappayButtonElement` only defined `get variant()`/`get size()`, so the assignment threw `Cannot set property variant of ... which has only a getter`. Added matching `set variant`/`set size` accessors that reflect to the underlying attribute, same as every other framework's attribute-binding path already did correctly.

## 1.0.1

### Patch Changes

- cebf6f0: Fix `@klappay/one` and `@klappay/one/react` throwing when imported anywhere Node evaluates them (SSR, static generation, prerendering in Next.js/Nuxt/SvelteKit/etc.) — `registerKlappayButton()` now no-ops instead of crashing when `HTMLElement`/`customElements` don't exist.
