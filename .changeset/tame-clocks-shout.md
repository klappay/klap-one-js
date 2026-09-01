---
"@klappay/one": minor
---

Add a `klappay:confirming` bridge signal, forwarded as `onConfirming`/a `confirming` DOM event, fired once the wallet has responded and a transaction was actually sent — `txHash`/`network` are both real and verifiable at this point, even though Core hasn't confirmed the payment yet.

Unlike `onPending`, an integrator can safely treat this one as authoritative enough to persist and auto-resume a "confirming" UI from, independent of whatever happens to this checkout afterward (reload, tab close, even the popup/iframe itself disappearing).
