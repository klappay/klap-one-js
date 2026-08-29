# Examples

Full create-a-charge-then-render-a-button integrations, one per stack. All
four follow the same shape: a tiny backend creates a `Charge` with
[`@klappay/node`](https://node-sdk.klappay.com) (your `KLAP_API_KEY` never
reaches the browser), then hands the resulting `chargeId` to `@klappay/one`
on the client — the pattern shown below and the one to ship.

The runnable apps under `examples/` wire the button's origin/charge ID
inputs to a "Generate button" button instead of fetching automatically, so
you can point the button at any charge without editing code; each
backend route is still real and working — `curl` it directly to mint a
`chargeId`, or wire the `fetch` back in for the shape shown below.

Want to clone and run one instead of reading it here? See
[`examples/`](https://github.com/klappay/klap-one-js/tree/main/examples) in
the repo — four standalone, `pnpm install && pnpm dev`-ready apps. Each
always depends on this repo's own local `@klappay/one` build (`pnpm build`
at the repo root), never a version from npm — see the repo's own
[`examples/README.md`](https://github.com/klappay/klap-one-js/tree/main/examples#readme)
for why, and for how CI separately verifies the real npm release still
works.

## Vanilla (no bundler)

Mirrors `klap-checkout`'s own zero-build setup — the `<script>` tag build
straight from `node_modules`, no `import` resolution in the browser at
all:

```ts
// src/server.ts — Hono
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { createClient } from '@klappay/node'

const klap = createClient({
  apiKey: process.env.KLAP_API_KEY!,
  baseUrl: process.env.KLAP_BASE_URL!,
})

const app = new Hono()

// The IIFE build, served straight from node_modules — always matches
// whatever version is actually installed, no copying into ./public.
app.use(
  '/vendor/one/*',
  serveStatic({
    root: './node_modules/@klappay/one/dist',
    rewriteRequestPath: (path) => path.replace(/^\/vendor\/one/, ''),
  }),
)

app.post('/api/charges', async (c) => {
  const charge = await klap.charges.create({
    amount: 25,
    currency: 'USD',
    expiresIn: 3600,
    acceptedPayments: [{ token: 'USDC', network: 'base' }],
  })
  return c.json({ chargeId: charge.id })
})

export { app }
```

```html
<!-- public/index.html -->
<script src="/vendor/one/index.global.js"></script>
<button id="pay">Pay $25</button>
<script>
  document.getElementById('pay').addEventListener('click', async () => {
    const { chargeId } = await fetch('/api/charges', { method: 'POST' }).then((r) => r.json())
    KlappayOne.createKlappayOne({
      chargeId,
      origin: 'https://klap.one',
      onSuccess: (result) => alert(`Paid! ${result.txHash}`),
      onError: (error) => alert(error.message),
    }).open()
  })
</script>
```

See [The button](/button) for the zero-JS `<klappay-button>` / `data-klappay-one`
alternatives to the manual `createKlappayOne()` call above — either works
equally well once the script tag is loaded this way.

## Next.js (App Router)

A Route Handler for charge creation, a Client Component for the button —
see [React](/react) for why `<KlappayButton />` needs a `'use client'`
boundary.

`lib/klap.ts`:

```ts
import { createClient } from '@klappay/node'

export const klap = createClient({
  apiKey: process.env.KLAP_API_KEY!,
  baseUrl: process.env.KLAP_BASE_URL!,
})
```

`app/api/charges/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { klap } from '@/lib/klap'

export async function POST() {
  const charge = await klap.charges.create({
    amount: 25,
    currency: 'USD',
    expiresIn: 3600,
    acceptedPayments: [{ token: 'USDC', network: 'base' }],
  })
  return NextResponse.json({ chargeId: charge.id })
}
```

`app/checkout/CheckoutButton.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { KlappayButton } from '@klappay/one/react'

export function CheckoutButton() {
  const [chargeId, setChargeId] = useState<string | null>(null)

  if (!chargeId) {
    return (
      <button
        onClick={async () => {
          const res = await fetch('/api/charges', { method: 'POST' })
          const data = await res.json()
          setChargeId(data.chargeId)
        }}
      >
        Start checkout
      </button>
    )
  }

  return (
    <KlappayButton
      chargeId={chargeId}
      origin={process.env.NEXT_PUBLIC_KLAP_ONE_ORIGIN!}
      onSuccess={(result) => console.log('paid', result.txHash)}
    />
  )
}
```

## Nuxt

Nitro server route for charge creation, a Vue component around the raw
`<klappay-button>` element — see [Other frameworks](/frameworks#vue) for
the `isCustomElement` compiler option Nuxt needs.

`server/api/charges.post.ts`:

```ts
import { createClient } from '@klappay/node'

const klap = createClient({
  apiKey: process.env.KLAP_API_KEY!,
  baseUrl: process.env.KLAP_BASE_URL!,
})

export default defineEventHandler(async () => {
  const charge = await klap.charges.create({
    amount: 25,
    currency: 'USD',
    expiresIn: 3600,
    acceptedPayments: [{ token: 'USDC', network: 'base' }],
  })
  return { chargeId: charge.id }
})
```

`app/components/CheckoutButton.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { configure } from '@klappay/one'

const chargeId = ref<string | null>(null)
configure({ origin: useRuntimeConfig().public.klapOneOrigin })

async function start() {
  const data = await $fetch('/api/charges', { method: 'POST' })
  chargeId.value = data.chargeId
}

function onSuccess(event: Event) {
  console.log('paid', (event as CustomEvent).detail.txHash)
}
</script>

<template>
  <button v-if="!chargeId" @click="start">Start checkout</button>
  <klappay-button v-else :charge-id="chargeId" @success="onSuccess" />
</template>
```

## SvelteKit

A `+server.ts` route for charge creation, the raw `<klappay-button>`
element directly in the Svelte template:

`src/routes/api/charges/+server.ts`:

```ts
import { json } from '@sveltejs/kit'
import { createClient } from '@klappay/node'
import { KLAP_API_KEY, KLAP_BASE_URL } from '$env/static/private'

const klap = createClient({ apiKey: KLAP_API_KEY, baseUrl: KLAP_BASE_URL })

export async function POST() {
  const charge = await klap.charges.create({
    amount: 25,
    currency: 'USD',
    expiresIn: 3600,
    acceptedPayments: [{ token: 'USDC', network: 'base' }],
  })
  return json({ chargeId: charge.id })
}
```

`src/routes/checkout/+page.svelte`:

```svelte
<script lang="ts">
  import { configure } from '@klappay/one'
  import { PUBLIC_KLAP_ONE_ORIGIN } from '$env/static/public'

  let chargeId: string | null = null
  configure({ origin: PUBLIC_KLAP_ONE_ORIGIN })

  async function start() {
    const res = await fetch('/api/charges', { method: 'POST' })
    const data = await res.json()
    chargeId = data.chargeId
  }

  function onSuccess(event: CustomEvent) {
    console.log('paid', event.detail.txHash)
  }
</script>

{#if !chargeId}
  <button on:click={start}>Start checkout</button>
{:else}
  <klappay-button charge-id={chargeId} on:success={onSuccess} />
{/if}
```

## Every example uses the public `/v1` API

Same as `@klappay/node`/`@klappay/checkout-kit`'s own examples: every
example above calls `klap.charges.create()` against Core's public,
API-key-authenticated `/v1` surface — the same access any external
merchant integration has. That means each example only ever creates
charges under the `KLAP_API_KEY` you provide; see each example's own
README for exactly which environment variables to set before running it.
