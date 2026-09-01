---
"@klappay/one": minor
---

`<klappay-button>`'s default label changes from `"Pay with Klappay"` to `"Pay with Klappay One"`, and a new `label` attribute (`full` | `short`, defaults to `full`) lets an integrator switch it to the shorter `"Klappay One"` — useful where space is tight (e.g. `size="sm"`). The `KlappayButton` React wrapper exposes the same prop.

The button's logo mark is also ~30% larger across all three sizes (`sm`/`md`/`lg`) so it doesn't read as an afterthought next to the longer label.
