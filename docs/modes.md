# iframe vs. popup

`createKlappayOne()` picks one of two renderers before every `open()`
call: an iframe/modal, or a popup. Both talk the exact same
[bridge protocol](/protocol) and accept the exact same
[`KlappayOneConfig`](/programmatic) — the only difference is how the
checkout is mounted, chosen for you unless you override it.

## The default

```ts
function resolveMode(config) {
  return config.mode ?? (isMobileUserAgent(navigator.userAgent) ? 'popup' : 'iframe')
}
```

- **Desktop → iframe/modal.** A backdrop-dismissible overlay, isolated in
  Shadow DOM so neither your page's CSS nor Klappay's leaks across the
  boundary (see `core/iframe.ts`).
- **Mobile → popup.** Detected by user agent (`Android|iPhone|iPad|iPod`),
  mirroring `klap-one`'s own `web/src/lib/is-mobile.ts` heuristic exactly.
  Mobile defaults to a popup because whether a backgrounded iframe's
  WalletConnect relay connection survives the OS switching to the wallet
  app and back hasn't been verified — a top-level popup tab doesn't have
  that risk.

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

## Dismissing the iframe

Clicking the semi-transparent backdrop behind the iframe reports as a
cancel, same as closing a popup does — `event.target === backdrop` is
checked so clicks that land on the iframe itself (or bubble from inside
it, which they can't, being cross-origin) never trigger a false dismiss.

A backdrop-dismiss click and a genuine `postMessage` (a real `success`/
`error`/`cancel` arriving the same tick) can race — a `settled` guard
inside `openViaIframe()` makes sure your config's callbacks fire exactly
once per checkout no matter which trigger wins that race.

## Resizing

The iframe opens at a fixed `420×360` — a neutral loading size, not a
guess at any real screen's height — and animates in (a slight slide down
+ fade, ~200ms) at the same time the backdrop fades in. From there it
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

The merchant page's own `<body>` is pinned with `position: fixed` for as
long as the modal is open (restored, scroll position included, once it's
actually gone), so a page taller than the screen can't keep scrolling
behind it — `overflow: hidden` alone doesn't reliably stop a real
wheel/trackpad gesture from doing that in every browser.

## See it running

Every app in [Examples](/examples) uses the default device-based mode
selection (no `mode` override) — open one on desktop and on a phone (or a
mobile device emulator) to see the iframe/modal and popup paths side by
side.
