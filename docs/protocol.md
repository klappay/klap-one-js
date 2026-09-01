# Protocol & security

`@klappay/one` runs in a merchant's own page — a completely different
threat model than a package that only ever touches a trusted backend's own
secrets. Everything below is this package's own `CLAUDE.md` non-negotiable
invariants, written out in full — not defaults you can configure away.

## What this package never has access to

- **A private key.** The payer's own wallet app signs everything — that
  happens entirely inside `one-id` (a different origin, a different
  repo). This package never proposes or builds a transaction itself.
- **A session token.** The payer's session lives in `one-id`'s own cookie,
  on Klappay's origin — this package never reads or stores anything from
  that popup/iframe beyond the public `PaymentResult` it relays via
  `postMessage`.

If you ever find yourself reaching for a private key or a session token
inside application code that imports `@klappay/one`, that's a sign the
design needs to change, not that this package needs a new escape hatch.

## The `postMessage` wire format

The same contract `one-js` and `one-id` both implement — canonical here,
mirrored by hand on the `klap-one` side (`web/src/lib/bridge.ts`), since
there's no shared package between the two repos to enforce it:

```ts
type BridgeMessage =
  | { type: 'klappay:ready'; requestId: string }
  | { type: 'klappay:resize'; requestId: string; height: number }
  | { type: 'klappay:pending'; requestId: string }
  | { type: 'klappay:confirming'; requestId: string; txHash: string; network: string }
  | { type: 'klappay:success'; requestId: string; result: PaymentResult }
  | { type: 'klappay:error'; requestId: string; error: { code: string; message: string } }
  | { type: 'klappay:cancel'; requestId: string }
```

`klappay:pending` is sent right before `one-id` asks the wallet to
sign/send — before it has responded at all, so there's no `txHash` or any
other payload yet. It exists purely so an integrator can persist "a
payment attempt is underway" ahead of a possible reload/close; `onPending`
is not a terminal outcome and doesn't re-enable the button the way
`onSuccess`/`onError`/`onCancel` do.

`klappay:confirming` is sent once the wallet has responded and a
transaction was actually sent — `txHash`/`network` are both real and
verifiable at this point, even though Core hasn't confirmed the payment
yet. Like `onPending`, it isn't a terminal outcome. Unlike `onPending`, an
integrator can safely treat this one as authoritative enough to persist
and auto-resume a "confirming" UI from — a `txHash` can be checked against
Core independently of whatever happens to this checkout afterward
(reload, tab close, even the popup/iframe itself disappearing), which
isn't true yet at the `onPending` stage.

`klappay:cancel` only ever means a deliberate in-page Cancel click — this
package's own `onCancel` config callback receives a second possible
`reason`, `'closed'`, that `one-id` never sends: `core/klappay-one.ts`
synthesizes it locally when a popup disappears (closed via the browser's
own UI) with no bridge message at all, since there was no chance for
`one-id` to report anything. A caller that wants to distinguish "the payer
explicitly backed out" from "we genuinely don't know what happened" should
branch on this reason, not treat every cancel the same.

- **`chargeId`/`requestId`/`locale`/`returnOrigin` travel in the popup/
  iframe URL itself** (`/id/?chargeId=X&requestId=Y&locale=en&returnOrigin=https://merchant.com`)
  — none of these values are secret, and putting them in the URL avoids a
  race a bidirectional handshake would otherwise have ("did my config
  `postMessage` arrive before the page was ready?"). `postMessage` only
  carries the **return** path, `one-id` → `one-js`.
- **`requestId`** is generated fresh by `core/klappay-one.ts`
  (`crypto.randomUUID()`, not a secret) on every `open()` call — it's what
  lets a single page with more than one button/charge tell which `open()`
  call a given response belongs to.
- **Every message the checkout sends targets `returnOrigin` specifically**
  as its `postMessage` `targetOrigin` (never `'*'`) — defense in depth,
  since nothing in these messages is actually secret (a public `txHash`, a
  public wallet address, an error code), but there's still no reason to
  use a wildcard target when the real one is already known.

## `core/bridge.ts` validates every message before trusting it

This is the specific invariant this repository's own test suite exists to
protect (`src/core/bridge.test.ts`):

```ts
function onMessage(event: MessageEvent): void {
  if (event.origin !== klapOneOrigin) return
  if (!isBridgeMessage(event.data) || event.data.requestId !== requestId) return
  // ... only now is event.data trusted
}
```

Two checks, both required, in this order:

1. **`event.origin` must match the configured Klappay origin exactly.**
   A message from any other origin — including a malicious page that
   somehow gets a reference to your window — is silently dropped.
2. **`event.data.requestId` must match the specific `open()` call in
   flight.** Even a genuine message from the correct origin, but for a
   *different* checkout (a stale popup left open, or a second button on
   the same page), is silently dropped rather than partially trusted.

A message failing either check is dropped with no error surfaced and no
partial trust extended — it's simply as if the message never arrived, not
a degraded "trust some of it" path.

## The popup/iframe content is never white-labeled

`variant`/`size` only ever style the **button** this package renders —
`one-id`'s own content inside the popup/iframe is 100% Klappay's, always,
on every integration, with no merchant branding/logo anywhere in it. This
isn't a missing feature; it's deliberate, the same reasoning Apple Pay and
Google Pay apply to their own buttons: a payer needs to recognize "this is
Klappay asking me for approval" regardless of which merchant embedded the
button. See [Styling](/styling) for the actual customization surface.

## `onSuccess` is a UX signal, never proof of payment

The same principle Stripe applies to its own webhook: **never release a
product because the browser said "it worked."** The tab can close mid-flow,
the network can drop the confirmation, and a callback is trivially easy for
an integrator to misuse as if it were authoritative. `onSuccess` exists for
UX — show a "Paid!" screen, redirect to a thank-you page — while real
fulfillment (releasing the product, marking an order paid in your own
database) has to come from Klappay Core's own `charge.confirmed` webhook,
the same webhook system Core uses for everything else.

```ts
// WRONG — releases the product based only on the client-side callback
onSuccess: (result) => releaseProductDirectly(result.txHash)

// RIGHT — onSuccess only drives UX; your backend releases the product
// once it receives Klappay Core's charge.confirmed webhook
onSuccess: (result) => {
  showThankYouScreen(result.txHash)
  router.push(`/order/awaiting-confirmation?tx=${result.txHash}`)
}
```

See `@klappay/node`'s [webhook verification](https://node-sdk.klappay.com/webhooks)
docs for constructing and verifying that event server-side.

## No `eval`/`Function` over anything from the network

The button's markup/CSS is a static template compiled into this package's
build (`ui/klappay-button.ts`'s `#css()`, `core/iframe.ts`'s `css()`) —
never HTML built from an API response. There's no code path in this
package that interprets a string from a network response as executable
code or markup.

## Mirrored, not shared

`core/bridge.ts`'s `BridgeMessage` type mirrors `klap-one`'s own
`web/src/lib/bridge.ts` by hand — there's no shared package between the
two repositories enforcing the two stay in sync, since `one-js` ships to
npm/a public CDN and `klap-one`'s backend code never should. Any change to
the wire format has to land in both places deliberately.

## See it running

Every app in [Examples](/examples) creates its `Charge` server-side with
`@klappay/node`, never exposes `KLAP_API_KEY` to the browser, and only
ever uses `onSuccess` to update the UI — the same invariants described
above, applied end to end in a real, running app.
