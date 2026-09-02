---
"@klappay/one": minor
---

The iframe/modal no longer closes when the payer clicks the backdrop behind it. Previously, clicking outside the checkout reported a cancel — now the only way out of an iframe checkout is a real `success`/`error`/`cancel` message from inside it, so a payer can no longer accidentally dismiss a checkout mid-flow with a stray click.

This relies on `one-id` always rendering its own in-page Cancel button on every step so a payer is never left with no way out — see the companion change on that side.
