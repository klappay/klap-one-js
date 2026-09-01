export type KlappayButtonVariant = 'white' | 'yellow' | 'black'
export type KlappayButtonSize = 'sm' | 'md' | 'lg'

// `code` is an open string, not a fixed union: most values (e.g.
// `payment_failed`, `wallet_error`) come from one-id's own bridge and can
// grow without a matching release here. `POPUP_BLOCKED`/`FRAME_TIMEOUT`
// are the only codes this package itself generates — see core/popup.ts
// and core/bridge.ts.
export interface KlappayOneError {
  code: string
  message: string
}

export interface PaymentResult {
  txHash: string
  walletAddress: string
  network: string
  amount: string
  confirmedAt: string
}

export interface KlappayOneConfig {
  chargeId: string
  origin: string
  locale?: string
  // Defaults to 'iframe' on desktop and 'popup' on mobile (see
  // core/device.ts) — set explicitly to force one or the other.
  mode?: 'iframe' | 'popup'
  onReady?: () => void
  // Fires once one-id is about to ask the wallet to sign/send — before it
  // has responded at all. No payload: there's nothing verifiable yet (no
  // txHash), this is purely a "something is about to become irreversible"
  // signal for a caller that wants to persist state ahead of a possible
  // reload/close.
  onPending?: () => void
  onSuccess?: (result: PaymentResult) => void
  onError?: (error: KlappayOneError) => void
  // 'user' is a deliberate in-page Cancel click relayed over the bridge.
  // 'closed' is synthesized locally (see core/klappay-one.ts's popup-closed
  // poll) when a popup disappears with no bridge message at all — there was
  // no chance for one-id to report anything, cancel or otherwise.
  onCancel?: (reason: 'user' | 'closed') => void
}

export interface KlappayOne {
  open: () => void
}
