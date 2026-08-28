# Styling

Only the **button** this package renders is customizable — the popup/
iframe content (`one-id`) never is. Klappay One isn't a white-label
product: a payer needs to recognize "this is Klappay asking me for
approval," the same way Apple Pay/Google Pay buttons only ever vary
color/size, never the branding behind them. See
[Protocol & security](/protocol#the-popupiframe-content-is-never-white-labeled)
for why that boundary is a non-negotiable invariant, not just a current
limitation.

## `variant` and `size`

Three color presets, three sizes — deliberately not an arbitrary color
system (no `primaryColor: '#ff00ff'`):

```html
<klappay-button charge-id="ch_123" variant="black" size="md"></klappay-button>
```

| `variant` | Background | Text |
| --- | --- | --- |
| `white` (default background) | `#ffffff` | `#111111` |
| `yellow` | `#f2b90c` | `#111111` |
| `black` (default) | `#111111` | `#ffffff` |

| `size` | Height |
| --- | --- |
| `sm` | `32px` |
| `md` (default) | `40px` |
| `lg` | `48px` |

Both attributes are reactive — changing them after the element is mounted
updates the rendered button immediately, no re-render/remount needed.

## CSS custom properties across the Shadow DOM boundary

`<klappay-button>` renders inside a Shadow DOM, isolating your page's CSS
from leaking into the button (and vice versa) — a generic `button { ... }`
rule on your page can't accidentally break Klappay's button just by
existing. A handful of CSS custom properties are the one thing
deliberately exposed to cross that boundary, enough to fit the button into
your page's design without opening the door to reimplementing the whole
component:

```css
klappay-button {
  --klappay-radius: 4px;
  --klappay-font-family: 'Inter', sans-serif;
  --klappay-button-height: 44px;
  --klappay-background: #2563eb;
  --klappay-color: #ffffff;
}
```

| Property | Affects |
| --- | --- |
| `--klappay-radius` | Corner radius (default `8px`). |
| `--klappay-font-family` | Font stack (default `system-ui, sans-serif`). |
| `--klappay-button-height` | Overrides the `size` preset's height. |
| `--klappay-background` | Overrides the `variant` preset's background. |
| `--klappay-color` | Overrides the `variant` preset's text color. |

`--klappay-background`/`--klappay-color` still key off whichever `variant`
you set — they override that variant's colors specifically, they don't
replace the variant system with an unbounded one. If you need a color
outside the three presets entirely, set `variant="black"` (or any) and
override both properties together, as in the example above.

## Your own button (`data-klappay-one`)

The [`data-klappay-one`](/button#your-own-button-data-klappay-one) path
renders nothing of its own — it only adds a click handler to markup you
already control. There's no Shadow DOM, no `variant`/`size`, and no CSS
custom properties to reach for: style the element with your own CSS the
same way you'd style any other button on your page.

```css
[data-klappay-one] {
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
}
[data-klappay-one][data-klappay-one-busy] {
  opacity: 0.6;
  pointer-events: none;
}
```

## See it running

The [vanilla example](/examples#vanilla-no-bundler) renders a plain
`<button>` you own and style entirely yourself, wired up with
`createKlappayOne()`; every framework example in [Examples](/examples)
renders `<klappay-button>`/`<KlappayButton />` with the default
`variant`/`size` — a good starting point to try overriding the CSS custom
properties above against a real, running app.
