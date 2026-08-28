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
  onSuccess?: (result: PaymentResult) => void
  onError?: (error: KlappayOneError) => void
  onCancel?: () => void
}

export interface KlappayOne {
  open: () => void
}
