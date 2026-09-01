import type { ReconnectState } from './bridge'

export type KlappayButtonVariant = 'white' | 'yellow' | 'black'
export type KlappayButtonSize = 'sm' | 'md' | 'lg'
export type KlappayButtonLabel = 'full' | 'short'

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
  // Defaults to 'iframe' on every device — set explicitly to force
  // 'popup' instead. See core/klappay-one.ts's resolveMode for why
  // mobile no longer defaults to popup.
  mode?: 'iframe' | 'popup'
  onReady?: () => void
  // Fires once one-id is about to ask the wallet to sign/send — before it
  // has responded at all. No payload: there's nothing verifiable yet (no
  // txHash), this is purely a "something is about to become irreversible"
  // signal for a caller that wants to persist state ahead of a possible
  // reload/close.
  onPending?: () => void
  // Fires once one-id has a txHash — the wallet responded and a
  // transaction was sent, but Core hasn't confirmed it yet. Unlike
  // onPending, there's now something real to persist and verify against
  // Core independently of whatever happens to this checkout afterward.
  onConfirming?: (data: { txHash: string; network: string }) => void
  onSuccess?: (result: PaymentResult) => void
  onError?: (error: KlappayOneError) => void
  // 'user' is a deliberate in-page Cancel click relayed over the bridge.
  // 'closed' is synthesized locally (see core/klappay-one.ts's popup-closed
  // poll) when a popup disappears with no bridge message at all — there was
  // no chance for one-id to report anything, cancel or otherwise.
  onCancel?: (reason: 'user' | 'closed') => void
  // Fires when the payer returns from backgrounding the tab/app (e.g.
  // switching to their wallet app to approve, then coming back) and
  // one-id has to check whether its WalletConnect relay connection
  // survived — 'started' while it retries, then 'recovered' or 'failed'.
  // Purely informational, on both popup and iframe alike (see
  // core/klappay-one.ts's resolveMode comment on why this isn't
  // iframe-specific) — safe to ignore; onCancel/onError are unaffected
  // either way, a 'failed' reconnect still leaves the existing Cancel
  // button and error paths as the way out.
  onReconnecting?: (state: ReconnectState) => void
}

export interface KlappayOne {
  open: () => void
}
