---
"@klappay/one": minor
---

`<klappay-button>` now renders Klappay's logo mark next to the label — a different variant per `variant` (`black`, `white`, `yellow`) chosen for contrast against that background.

`<klappay-button>` also now renders natively `disabled` whenever `charge-id` is missing or `origin` can't be resolved (neither the attribute nor `configure()` set it), reactively updating as those attributes change, instead of only failing silently on click.
