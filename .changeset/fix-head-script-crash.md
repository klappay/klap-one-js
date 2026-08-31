---
"@klappay/one": patch
---

Fix `@klappay/one`'s entry module crashing (and never assigning `window.KlappayOne`) when loaded via a `<script>` tag placed in `<head>` — the documented no-bundler path. `observeNewElements()` was called unconditionally regardless of `document.readyState`, unlike `wireExisting()`, so it read `document.body` while it was still `null` (the parser hadn't reached `<body>` yet) and `observer.observe(null, ...)` threw, aborting the whole module before it could export anything. Both calls now wait for the same readiness.
