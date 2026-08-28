# The button

Two zero-JavaScript entry points, both wired up by `core/klappay-one.ts`
under the hood — neither is a second implementation, both just build a
`KlappayOneConfig` from attributes and call `createKlappayOne(config).open()`.

## `<klappay-button>`

A real Custom Element (`customElements.define('klappay-button', ...)`),
rendered inside a Shadow DOM so neither the host page's CSS nor Klappay's
own leaks across the boundary:

```html
<klappay-button
  charge-id="ch_123"
  origin="https://klap.one"
  variant="black"
  size="md"
  locale="en"
  mode="iframe"
></klappay-button>
```

| Attribute | Required | Description |
| --- | --- | --- |
| `charge-id` | Yes | The `Charge` this checkout is for. |
| `origin` | Only if not [`configure()`'d](/getting-started#origin-one-way-or-another) | Which Klappay origin to open. |
| `variant` | No | `white` \| `yellow` \| `black` — defaults to `black`. See [Styling](/styling). |
| `size` | No | `sm` \| `md` \| `lg` — defaults to `md`. See [Styling](/styling). |
| `locale` | No | Forwarded to the checkout — falls back to `configure()`'s `locale`. |
| `mode` | No | `iframe` \| `popup` — forces a mode instead of the [device default](/modes). |

`variant`/`size` are reactive — changing either attribute after the element
is already on the page (`el.setAttribute('variant', 'white')`) updates the
rendered button immediately, via `attributeChangedCallback`.

### Events

```ts
const button = document.querySelector('klappay-button')
button.addEventListener('success', (event) => console.log(event.detail)) // PaymentResult
button.addEventListener('error', (event) => console.log(event.detail)) // KlappayOneError
button.addEventListener('cancel', () => console.log('payer closed the checkout'))
```

A second click before the first checkout settles is ignored — the button
disables itself (`this.#button.disabled = true`) the moment it opens the
popup/iframe, and re-enables on whichever of `success`/`error`/`cancel`
fires first. That's what stops a fast double-click from opening two
popups/iframes stacked on top of each other.

Missing `charge-id` or `origin` (and no [`configure()`](/getting-started#origin-one-way-or-another)
default) logs a `console.error` and does nothing on click — it never
throws, so one misconfigured button on a page doesn't take the rest of the
page down with it.

## Your own button: `data-klappay-one`

For when you already have a button and don't want a second custom element
in your markup — any clickable element works, not just `<button>`:

```html
<button data-klappay-one="ch_123" data-klappay-one-origin="https://klap.one">
  Pay with Klappay
</button>
```

| Attribute | Required | Description |
| --- | --- | --- |
| `data-klappay-one` | Yes | The `chargeId` — also what marks the element for auto-wiring. |
| `data-klappay-one-origin` | Only if not [`configure()`'d](/getting-started#origin-one-way-or-another) | Which Klappay origin to open. |
| `data-klappay-one-locale` | No | Falls back to `configure()`'s `locale`. |
| `data-klappay-one-mode` | No | `iframe` \| `popup` — forces a mode instead of the [device default](/modes). |

Same `success`/`error`/`cancel` `CustomEvent`s as `<klappay-button>` above,
dispatched on the element itself. There's no `variant`/`size` here — this
path renders nothing, it only adds a click handler to markup you already
control, so styling is entirely up to your own CSS.

While a checkout is in flight the element carries a `data-klappay-one-busy`
attribute (added on click, removed on `success`/`error`/`cancel`) — the
same double-click guard as `<klappay-button>`, just expressed as an
attribute instead of the native `disabled` property, since the wired
element isn't necessarily a form control.

```css
[data-klappay-one][data-klappay-one-busy] {
  opacity: 0.6;
  pointer-events: none;
}
```

### Elements added after the script loads

Both `wireExisting()` (run once on load) and a `MutationObserver`
(`observeNewElements()`, watching `document.body` for the lifetime of the
page) wire up `[data-klappay-one]` elements — so a button rendered by a
client-side router, injected by a third-party script, or added inside a
modal opened later all get wired automatically, with no manual
`re-wire()` call needed anywhere in your code.

## Choosing between the two

Reach for `<klappay-button>` when you want Klappay's own button styling
(pick a `variant`/`size` and move on) — it's the fastest path and the one
[the button preview in `klap-app`](https://github.com/klappay/klap-one)
matches exactly. Reach for `data-klappay-one` when the button already needs
to match a design system you don't control from here — your own markup,
your own CSS, this package only adds the click handler.

## See it running

[Examples](/examples) has both patterns wired to a real backend that
creates the charge first — the [vanilla example](/examples#vanilla-no-bundler)
drives a plain button with the [programmatic API](/programmatic) directly,
and every framework example wires up `<klappay-button>`/`<KlappayButton />`
end to end.
