---
"@klappay/one": patch
---

Fix the checkout modal letting the merchant's own page scroll behind it while open — a wheel/trackpad gesture over the backdrop now only scrolls the backdrop itself (when a step is genuinely taller than the viewport), never the page underneath, without ever touching the host page's own `<body>`/`<html>`. Also adds a sensible minimum height so a short step (e.g. the initial identify screen) doesn't look cramped on a tall window, and a subtle slide-down + scale + fade entrance/exit animation.
