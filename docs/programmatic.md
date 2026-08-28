# Programmatic API

For anything the two zero-JS entry points can't express — opening the
checkout from your own event handler, deferring `origin` resolution, or
building a fully custom trigger element — call `createKlappayOne()`
directly. `ui/klappay-button.ts` and `ui/auto-wire.ts` are themselves thin
callers into this exact function; there's no separate logic path hiding
behind the markup-based entry points.

```ts
import { createKlappayOne } from '@klappay/one'

const klappayOne = createKlappayOne({
  chargeId: 'ch_123',
  origin: 'https://klap.one',
  locale: 'en',
  mode: 'iframe',
  onReady: () => console.log('checkout loaded'),
  onSuccess: (result) => {
    // result: PaymentResult — see below. UX signal only, see /protocol.
  },
  onError: (error) => {
    // error: KlappayOneError — see /errors.
  },
  onCancel: () => console.log('payer closed the checkout'),
})

document.querySelector('#pay-button')!.addEventListener('click', () => {
  klappayOne.open()
})
```

## `KlappayOneConfig`

```ts
interface KlappayOneConfig {
  chargeId: string
  origin: string
  locale?: string
  mode?: 'iframe' | 'popup'
  onReady?: () => void
  onSuccess?: (result: PaymentResult) => void
  onError?: (error: KlappayOneError) => void
  onCancel?: () => void
}
```

| Field | Description |
| --- | --- |
| `chargeId` | Required. The `Charge` this checkout is for — created ahead of time on your backend. |
| `origin` | Required. Which Klappay origin to open — no default, since sandbox and production point at different hosts. |
| `locale` | Forwarded to the checkout. |
| `mode` | `'iframe'` \| `'popup'` — forces a mode instead of the [device default](/modes). |
| `onReady` | Fires once the popup/iframe signals it has loaded (`klappay:ready`). Useful for hiding a loading spinner over the trigger button. |
| `onSuccess` | Fires with a `PaymentResult` once the payer completes payment. **Not proof of payment** — see [Protocol & security](/protocol#onsuccess-is-a-ux-signal-never-proof-of-payment). |
| `onError` | Fires with a `KlappayOneError` — see [Errors](/errors) for every code. |
| `onCancel` | Fires when the payer closes the popup/iframe without completing payment, by any means — an explicit Cancel button inside the checkout, the browser's native close button, alt-F4, swiping away a mobile popup. |

## `PaymentResult`

```ts
interface PaymentResult {
  txHash: string
  walletAddress: string
  network: string
  amount: string
  confirmedAt: string
}
```

Every field here is public on-chain data by the time this fires — a
transaction hash, a wallet address, which network, how much, and when it
confirmed. None of it is a secret, and none of it is a substitute for your
backend's own webhook-driven fulfillment.

## `open()`

```ts
interface KlappayOne {
  open: () => void
}
```

Calling `open()` again while a checkout from a previous `open()` call is
still in flight opens a second, independent popup/iframe — `createKlappayOne()`
itself does no de-duplication; that's what `ui/klappay-button.ts`'s
`disabled` guard and `ui/auto-wire.ts`'s `data-klappay-one-busy` guard exist
for on the two markup-based entry points. If you're calling `open()` from
your own click handler, guard it the same way:

```ts
let busy = false
button.addEventListener('click', () => {
  if (busy) return
  busy = true
  klappayOne.open()
})
// then clear `busy` in onSuccess/onError/onCancel
```

Each call to `open()` generates its own `requestId` (`crypto.randomUUID()`)
internally — that's what lets the bridge tell which `open()` call a given
`postMessage` response belongs to, so more than one `createKlappayOne()`
instance can safely coexist on the same page (e.g. one button per line
item in a cart). See [Protocol & security](/protocol) for the full wire
format.

## `configure()` / `getGlobalConfig()`

```ts
import { configure, getGlobalConfig } from '@klappay/one'

configure({ origin: 'https://klap.one', locale: 'en' })
getGlobalConfig() // -> { origin: 'https://klap.one', locale: 'en' }
```

Sets the page-wide default `origin`/`locale` that `<klappay-button>` and
`data-klappay-one` fall back to when they don't carry their own
`origin`/`locale` attribute. `createKlappayOne()` itself never reads this —
the programmatic API always requires `origin` explicitly, since it has no
natural attribute to fall back to and no excuse to make a required field
implicit.
