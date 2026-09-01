# React

`@klappay/one/react` is a thin wrapper over `core/createKlappayOne` — it
doesn't reimplement anything, it just registers the same `<klappay-button>`
Custom Element used elsewhere and gives it idiomatic React props/events.
`react` is a peer dependency (`>=18`, optional) — nothing here loads unless
you actually `import` from the `/react` subpath.

## `<KlappayButton />`

```tsx
import { KlappayButton } from '@klappay/one/react'

function Checkout({ chargeId }: { chargeId: string }) {
  return (
    <KlappayButton
      chargeId={chargeId}
      origin="https://klap.one"
      variant="black"
      size="md"
      onSuccess={(result) => {
        // UX signal only — see /protocol.
        console.log('paid', result.txHash)
      }}
      onError={(error) => console.error(error.code, error.message)}
      onCancel={() => console.log('payer closed the checkout')}
    />
  )
}
```

```ts
interface KlappayButtonProps {
  chargeId: string
  origin?: string
  locale?: string
  variant?: KlappayButtonVariant
  size?: KlappayButtonSize
  label?: KlappayButtonLabel
  onSuccess?: (result: PaymentResult) => void
  onError?: (error: KlappayOneError) => void
  onCancel?: () => void
}
```

Under the hood, `<KlappayButton />` renders the real `<klappay-button>`
element (via a `ref`) and attaches/detaches native
`success`/`error`/`cancel` event listeners in a `useEffect` — the same
events documented in [The button](/button), just handed to you as props
instead of `addEventListener` calls. `origin` is optional here only
because it can come from [`configure()`](/getting-started#origin-one-way-or-another)
instead; set one or the other before rendering.

## `useKlappayOne()`

For a fully custom trigger — your own button, a menu item, a keyboard
shortcut — skip the rendered element entirely and drive `open()` yourself:

```tsx
import { useKlappayOne } from '@klappay/one/react'

function BuyButton({ chargeId }: { chargeId: string }) {
  const klappayOne = useKlappayOne({
    chargeId,
    origin: 'https://klap.one',
    onSuccess: (result) => console.log('paid', result.txHash),
  })

  return <button onClick={() => klappayOne.open()}>Buy now</button>
}
```

`useKlappayOne()` keeps your latest `config` in a `ref` and always calls
`createKlappayOne()` fresh on `open()` — so passing a new inline
`onSuccess`/`onError` on every render (as in the example above) is fine and
doesn't need `useCallback`; it never creates a stale closure over an old
`chargeId` the way storing a single `createKlappayOne()` instance in
`useState` on mount would.

## TypeScript: the `<klappay-button>` JSX intrinsic

Importing from `@klappay/one/react` also augments the global JSX namespace
so `<klappay-button>` type-checks if you ever render the raw element
directly instead of going through `<KlappayButton />`:

```tsx
import '@klappay/one/react'

;<klappay-button charge-id="ch_123" origin="https://klap.one" variant="black" />
```

You won't normally need this — `<KlappayButton />` above covers the same
ground with proper React event props — but it's there for cases like
server-rendering the tag name directly or interop with a non-React tree
mounted alongside your app.

## Next.js and other SSR frameworks

Both `@klappay/one` and `@klappay/one/react` are safe to import anywhere
Node evaluates them — `registerKlappayButton()` no-ops when
`customElements`/`HTMLElement` don't exist (there's no browser to define
the element against), instead of throwing. Rendering `<klappay-button>`/
`<KlappayButton />` during SSR/static generation emits the plain tag as
inert markup; it becomes the real interactive button once the client
bundle loads and `registerKlappayButton()` runs for real, upgrading the
already-present element in place — the same progressive-enhancement
behavior undefined Custom Elements get natively.

That said, every example in this repo still keeps `@klappay/one` out of
the server render entirely (`next/dynamic({ ssr: false })` below, Nuxt's
`<ClientOnly>`, SvelteKit's `export const ssr = false` — see
[Other frameworks](/frameworks#server-side-rendering)) — not to dodge a
crash, but because a payment button has zero SSR value: there's nothing
to index, and skipping the inert-then-upgraded render avoids a visible
pop-in the instant hydration finishes. Treat the pattern below as a UX
default worth keeping, not a workaround you still need:

```tsx
'use client'

import dynamic from 'next/dynamic'

const KlappayButton = dynamic(() => import('@klappay/one/react').then((m) => m.KlappayButton), {
  ssr: false,
})

export function CheckoutButton({ chargeId }: { chargeId: string }) {
  return <KlappayButton chargeId={chargeId} origin={process.env.NEXT_PUBLIC_KLAP_ONE_ORIGIN!} />
}
```

One more wrinkle specific to webpack (Next's default bundler, as opposed
to Turbopack): `@klappay/one/react`'s `package.json` `exports` only
declares `types`/`import` conditions (ESM only, no `require`) — webpack's
resolver can fail on that combination specifically for a code-split
`import()` like the one `next/dynamic` generates. If you hit a resolution
error there, alias the subpath straight at the built file in
`next.config.ts`:

```ts
import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@klappay/one/react': path.resolve(process.cwd(), 'node_modules/@klappay/one/dist/react/index.js'),
    }
    return config
  },
}

export default nextConfig
```

Every other framework with an SSR pass needs the equivalent of `ssr: false`
— see [Other frameworks](/frameworks) for Vue's `<ClientOnly>` and
SvelteKit's `export const ssr = false`. See
[Examples](/examples) for a full Next.js app with a Route Handler that
creates the `Charge` server-side, and the repo's
[`examples/nextjs/`](https://github.com/klappay/klap-one-js/tree/main/examples/nextjs)
for the complete, verified working files.
