---
"@klappay/one": patch
---

Fix the iframe modal showing an internal scrollbar (that this package has no way to style, since it's a different cross-origin document) whenever a checkout step's real content was taller than the client-side `max-height: calc(100vh - 32px)` cap — one-id measures its own content against the height `klappay:resize` gave it, with no idea that height might then get clamped shorter on this side. The frame's height is no longer capped; the backdrop itself scrolls (with its own styled scrollbar) on the rare step that's genuinely taller than the viewport.
