---
"@klappay/one": major
---

Rebrand the button to the new Klap One identity.

- **Breaking:** the `yellow` variant is removed — Klap One is black and white only. `variant="yellow"` now falls back to the default `black`. The `KlappayButtonVariant` type is now `'white' | 'black'`.
- The button label reads "Pay with Klap One" (`label="full"`) / "Klap One" (`label="short"`), and error messages say "Klap One".
- Each variant renders the new Klap One symbol cut for its background: the on-dark symbol on `black`, the light symbol on `white`.
- Colors follow the Zinc scale: `black` is `#09090b`, `white` gets a `#d4d4d8` border and `#09090b` text. The default font stack is now `Inter, system-ui, sans-serif`.
- In a container narrower than the button, the button now shrinks to fit and truncates the label with an ellipsis, instead of wrapping it onto a second line. Use `label="short"` where space is tight.
