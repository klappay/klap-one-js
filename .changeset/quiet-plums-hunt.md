---
"@klappay/one": minor
---

Add a `klappay:pending` bridge signal, forwarded as `onPending`/a `pending` DOM event, fired right before the wallet is asked to sign/send — before it has responded at all. Lets an integrator persist "a payment attempt is underway" ahead of a possible reload/close.

`onCancel` (and the `cancel` DOM event's `detail`) now carries a `reason`: `'user'` for a deliberate in-page Cancel, `'closed'` when a popup disappears with no bridge message at all (previously indistinguishable).

The iframe/modal renderer no longer allows a backdrop-click dismiss once a payment attempt has reached the point of no return (from `onPending` until the outcome settles) — a native popup close still can't be intercepted, which is exactly why the new `onPending` signal exists.
