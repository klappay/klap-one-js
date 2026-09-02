# iframe vs. popup

`createKlappayOne()` picks one of two renderers before every `open()`
call: an iframe/modal, or a popup. Both talk the exact same
[bridge protocol](/protocol) and accept the exact same
[`KlappayOneConfig`](/programmatic) — the only difference is how the
checkout is mounted, chosen for you unless you override it.

## The default

```ts
function resolveMode(config) {
  return config.mode ?? 'iframe'
}
```

**iframe/modal, on every device.** A modal overlay, isolated in Shadow
DOM so neither your page's CSS nor Klappay's leaks across the boundary
(see `core/iframe.ts`).

Mobile used to default to a popup instead, out of a concern that a
backgrounded iframe's WalletConnect relay connection might not survive
the OS switching to the wallet app and back. That turned out not to be a
real iframe-vs-popup distinction: a browser freezes an entire backgrounded
tab's frame tree together (confirmed against Chrome's own Page Lifecycle
behavior) — a popup tab gets exactly as frozen as an iframe embedded in
the merchant's own tab does, the moment the whole browser goes to the
background. What actually matters is `onReconnecting` (see
[Protocol & security](/protocol) and [Errors](/errors)): `one-id` detects
the relay connection dropping when the payer returns, retries it, and
falls back to an in-checkout retry affordance if that fails — on
*both* rendering modes, since the exposure is identical either way.

Pass `mode: 'iframe' | 'popup'` in config (or the `mode` /
`data-klappay-one-mode` attribute) to force one or the other regardless of
device:

```ts
createKlappayOne({ chargeId, origin, mode: 'popup' })
```

## The automatic iframe → popup fallback

If a merchant's Content-Security-Policy blocks `frame-src`/`child-src` for
Klappay's origin, an iframe would otherwise sit there blank forever with
no way for the payer to tell what went wrong. `openViaIframe()` guards
against exactly that: if the frame never sends a `klappay:ready` message
within `READY_TIMEOUT_MS` (10 seconds), it automatically retries the same
checkout as a popup before giving up. Only if the popup attempt *also*
times out (or gets blocked) does `onError` finally fire with
`FRAME_TIMEOUT` — see [Errors](/errors).

This fallback only exists on the iframe path. A popup that's actually
blocked by the browser is detected immediately (`popup === null || popup.closed`
right after `window.open()`), so there's no equivalent "popup → iframe"
fallback to build — a blocked popup fails fast with `POPUP_BLOCKED`
instead of waiting out a timeout.

## Detecting a closed popup

Unlike an iframe (which fires a real `postMessage` on cancel from an
in-page Cancel button), a popup can be closed by means the page inside it
never gets a chance to react to — the browser's native close button,
alt-F4, swiping it away on mobile. `createKlappayOne()` polls
`popup.closed` every 500ms for exactly that reason (the same fallback
OAuth-popup libraries use) and fires `onCancel` the moment it detects the
popup is gone, even if no `klappay:cancel` message ever arrived.

## Closing the iframe

The backdrop behind the iframe has no click-to-dismiss, and there's no
Escape-key handling either — the only way out of an iframe checkout is a
real `success`/`error`/`cancel` `postMessage` from inside it. `one-id` is
a different origin whose content this package never controls (see
[Protocol & security](/protocol)'s "never white-labeled" invariant), so
it's on `one-id` to always render its own in-page Cancel button — a
payer is never left with no way out.

Two bridge messages can still race for one checkout (e.g. a late
`success` lands the same tick the iframe → popup fallback above fires) —
a `settled` guard inside `openViaIframe()` makes sure your config's
callbacks fire exactly once no matter which one wins.

## Resizing

The iframe opens at a fixed `420×360` — a neutral loading size, not a
guess at any real screen's height — and animates in (a slide down + scale
+ fade, ~320ms) at the same time the backdrop fades in. From there it
resizes in response to `klappay:resize` messages the checkout sends as
its own content's height changes, growing/shrinking with the same
transition timing, so you never need to guess a height up front or leave
dead whitespace around a shorter step in the flow (e.g. an error screen).
Closing reverses the same transition before the modal actually leaves the
DOM.

The frame's width is capped at `calc(100vw - 32px)`, but its height isn't
— one-id measures its own content against whatever height it's actually
given, with no idea a client-side cap might otherwise cut that shorter,
so clamping it here would leave content taller than what renders, forcing
a scrollbar inside the iframe itself that's a different, cross-origin
document and unstyleable from this side of the bridge. The backdrop
scrolls instead (with its own styled scrollbar) on the rare step that's
genuinely taller than the viewport.

The frame does have a `min-height: min(480px, 70vh)`, though — a short
step (identify is just an OTP input) would otherwise look cramped on a
tall desktop window, so the frame keeps a sensible floor instead of
hugging every step's exact content height. Capped at `70vh` rather than a
flat `480px` so that floor never itself forces a short browser window
into overflow just to be met — a genuinely taller step still grows past
it exactly as before.

A page taller than the screen can't keep scrolling behind the backdrop
either, without ever touching the merchant page's own `<body>`/`<html>` —
the same technique `react-remove-scroll` (what Radix's `Dialog`/`Popover`
use under the hood) applies: a `wheel` listener on `document`, only
calling `preventDefault()` once the backdrop itself has nowhere left to
scroll in that direction. A step still scrolls normally on its own long
content instead of every gesture just getting blocked outright — the
listener comes off `document` again the moment the modal closes.

## See it running

Every app in [Examples](/examples) uses the default (no `mode` override)
— open one to see the iframe/modal path, or pass `mode: 'popup'` (or
`mode="popup"` on the markup entry points) to see the popup path instead.
