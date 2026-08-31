---
"@klappay/one": patch
---

Shrink the published bundle by ~18% — `<klappay-button>`'s logo icons are now encoded as lossless WebP instead of PNG (pixel-identical, ~37% smaller than before), and both the button's and the checkout modal's CSS are now built once at module load instead of being recomputed on every render.
