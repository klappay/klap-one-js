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

The iframe starts at a fixed `420×720` and resizes in response to
`klappay:resize` messages the checkout sends as its own content's height
changes — you never need to guess a height up front or leave dead
whitespace around a shorter step in the flow (e.g. an error screen).

## See it running

Every app in [Examples](/examples) uses the default device-based mode
selection (no `mode` override) — open one on desktop and on a phone (or a
mobile device emulator) to see the iframe/modal and popup paths side by
side.
