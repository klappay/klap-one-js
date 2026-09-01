---
"@klappay/one": minor
---

The checkout now defaults to iframe/modal on every device — mobile no longer defaults to a popup. A backgrounded tab freezes its entire frame tree together regardless of iframe vs. top-level content, so the popup default never actually protected against the WalletConnect relay dropping while a payer switches to their wallet app; `mode: 'popup'` still forces the popup renderer when you want it.

What actually protects against that is new: a `klappay:reconnecting` bridge signal, exposed as `onReconnecting?: (state: 'started' | 'recovered' | 'failed') => void` on `KlappayOneConfig` (and the exported `ReconnectState` type), fired when one-id detects and retries a dropped relay connection after the payer returns from backgrounding the tab/app. Purely informational — safe to ignore, never fires after a terminal `onSuccess`/`onError`/`onCancel`.
