# Other frameworks

`react/index.tsx` is the only framework wrapper this package ships — not
because other frameworks aren't supported, but because they don't need
one. `<klappay-button>` is a real
[Custom Element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements),
and `data-klappay-one` is a plain DOM attribute — both work natively in
every framework's own templating, with no adapter package required. Adding
a `vue/`/`svelte/` subpath here would just be a second implementation of
logic that already lives once in `core/`, which is exactly the kind of
duplication this package's own conventions rule out.

## Server-side rendering

Importing `@klappay/one`/`@klappay/one/react` in Node (SSR, static
generation, prerendering) is safe — `registerKlappayButton()` no-ops
when `customElements`/`HTMLElement` don't exist instead of throwing.
`<klappay-button>` renders as inert markup server-side and becomes the
real interactive button once the client bundle hydrates and registers it
for real — the same progressive-enhancement behavior an undefined Custom
Element gets natively in any browser.

Every framework example in this repo still keeps `@klappay/one` out of
the server render anyway — not to avoid a crash, but because a payment
button has zero SSR value (nothing to index) and skipping the
inert-then-upgraded render avoids a visible pop-in the instant hydration
finishes. Each framework's own mechanism for "this component is
browser-only":

- **Nuxt** — wrap the component in `<ClientOnly>` (see [Nuxt](#nuxt) below).
- **SvelteKit** — `export const ssr = false` in that route's `+page.ts`
  (see [SvelteKit](#sveltekit) below).
- **Next.js** — `next/dynamic(..., { ssr: false })`, see
  [React](/react#next-js-and-other-ssr-frameworks) for the full pattern
  (plus a webpack-resolver wrinkle specific to Next's default bundler,
  unrelated to the SSR question).
- **Plain Vue/Svelte/Angular without SSR** (a Vite SPA, for instance) —
  nothing to do here at all; none of this matters until something
  actually executes your components in Node before they reach a browser.

## Vue

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { configure } from '@klappay/one'

const props = defineProps<{ chargeId: string }>()
const button = ref<HTMLElement>()

configure({ origin: 'https://klap.one' })

function onSuccess(event: Event) {
  const result = (event as CustomEvent).detail
  console.log('paid', result.txHash)
}
</script>

<template>
  <klappay-button
    ref="button"
    :charge-id="props.chargeId"
    variant="black"
    size="md"
    @success="onSuccess"
  />
</template>
```

Vue's `@success` template syntax maps directly onto the native
`CustomEvent` dispatched by `<klappay-button>` (see [The button](/button))
— no wrapper needed. If your build tooling warns about an unknown custom
element, tell Vue's compiler to treat `klappay-button` as one:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'klappay-button',
        },
      },
    }),
  ],
})
```

### Nuxt

Nuxt renders every component server-side by default (Nitro's SSR).
Importing `@klappay/one` there [no longer crashes](#server-side-rendering),
but a payment button still has nothing worth server-rendering — wrap it in
Nuxt's built-in `<ClientOnly>` to skip straight to the client-only render:

```vue
<template>
  <ClientOnly>
    <klappay-button :charge-id="chargeId" @success="onSuccess" />
  </ClientOnly>
</template>
```

See the repo's
[`examples/nuxt/`](https://github.com/klappay/klap-one-js/tree/main/examples/nuxt)
for the complete, verified working app, including the
`vue.compilerOptions.isCustomElement` config from above wired into
`nuxt.config.ts`.

## Svelte

```svelte
<script lang="ts">
  import { configure } from '@klappay/one'

  export let chargeId: string

  configure({ origin: 'https://klap.one' })

  function onSuccess(event: CustomEvent) {
    console.log('paid', event.detail.txHash)
  }
</script>

<klappay-button charge-id={chargeId} variant="black" size="md" on:success={onSuccess} />
```

Svelte's `on:success` binds the same native `CustomEvent` directly — same
pattern as Vue above, no adapter package.

### SvelteKit

SvelteKit server-renders every route by default too. Importing
`@klappay/one` there [no longer crashes](#server-side-rendering), but same
reasoning as Nuxt above — opt that specific route out of SSR in its
`+page.ts` rather than render an inert button that only pops in once
hydrated:

```ts
// src/routes/checkout/+page.ts
export const ssr = false
```

This makes the route (and everything it imports, including
`@klappay/one`) render client-only, same effect as Nuxt's `<ClientOnly>`
above — just expressed as a route-level flag instead of a wrapper
component, since SvelteKit's SSR opt-out is per-route, not per-component.
See the repo's
[`examples/sveltekit/`](https://github.com/klappay/klap-one-js/tree/main/examples/sveltekit)
for the complete, verified working app.

## Angular

```html
<klappay-button
  [attr.charge-id]="chargeId"
  variant="black"
  size="md"
  (success)="onSuccess($event)"
></klappay-button>
```

```ts
@Component({
  selector: 'app-checkout',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent {
  onSuccess(event: CustomEvent) {
    console.log('paid', event.detail.txHash)
  }
}
```

`CUSTOM_ELEMENTS_SCHEMA` tells Angular's template compiler `klappay-button`
is an intentional custom element, not a typo'd component selector.

## No framework at all

The two markup-based entry points in [The button](/button) — `<klappay-button>`
and `data-klappay-one` — need nothing beyond the `<script>` tag itself; see
[Getting started](/getting-started) and the
[vanilla example](/examples#vanilla-no-bundler) for the complete picture.

## The pattern to notice

Every snippet above does the same three things: load `@klappay/one` (script
tag or `import`), render the tag or attribute your framework already
understands, and listen for the same `success`/`error`/`cancel`
`CustomEvent`s documented in [The button](/button). There's no framework-
specific state machine to get subtly wrong, because there isn't a second
one to write — `core/klappay-one.ts` is the only place `open()`,
`postMessage` listening, and mode selection are implemented, no matter
which of the entry points above triggers it.
