---
"@klappay/one": patch
---

Fix the merchant page behind the iframe modal still scrolling (and showing its own scrollbar) while the modal is open on top of it — `overflow: hidden` on `<html>`/`<body>` alone doesn't reliably block a wheel/trackpad scroll gesture in every browser. `<body>` is now pinned with `position: fixed` while the modal is open (the same technique every body-scroll-lock library uses), and its scroll position is restored exactly once the modal is gone.

Also swaps the open/close animation from a scale to a slight slide down + fade, matching the direction a modal is expected to arrive from.
