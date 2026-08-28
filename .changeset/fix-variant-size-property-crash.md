---
"@klappay/one": patch
---

Fix `KlappayButton` (React) and any JSX-rendered `<klappay-button>` crashing when passed `variant`/`size`. React sets custom-element props as DOM properties when a matching property already exists on the element — `KlappayButtonElement` only defined `get variant()`/`get size()`, so the assignment threw `Cannot set property variant of ... which has only a getter`. Added matching `set variant`/`set size` accessors that reflect to the underlying attribute, same as every other framework's attribute-binding path already did correctly.
