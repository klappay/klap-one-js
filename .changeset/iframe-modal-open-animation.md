---
"@klappay/one": minor
---

The iframe/modal renderer now fades and scales in on open (and reverses that on close/dismiss) instead of appearing and disappearing instantly, and opens at a small, neutral `420×360` loading size instead of a fixed `420×720` that had nothing to do with whatever screen was about to render — it grows/shrinks into the real content size with the same transition once `klappay:resize` reports it.
