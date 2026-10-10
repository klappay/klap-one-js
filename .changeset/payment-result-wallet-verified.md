---
"@klappay/one": minor
---

`PaymentResult` gains an optional `walletVerified` boolean. `one-id` now sends `onSuccess` with `walletVerified: false` for a payment Klap Core confirmed but Klap One couldn't tie to the payer's own wallet (a wallet paying through a relayer and a swap, for example), instead of an `onError` with `payment_failed` for a charge that was actually paid. Payments from EIP-7702 wallets behind a gas-sponsoring relayer (MetaMask smart accounts) and ERC-4337 accounts now confirm normally with `walletVerified: true`. A `klappay:success` whose `walletVerified` is present but not a boolean is dropped like any other malformed message. No change needed for existing integrations.
