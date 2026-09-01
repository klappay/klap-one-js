import type { KlappayOneError, PaymentResult } from './types'

// Mirrors web/src/lib/bridge.ts in klap-one — the canonical wire format
// is defined once in this repo's own docs/protocol.md; keep the two in
// sync manually, there's no shared package between the two repos to
// enforce it.
export type ReconnectState = 'started' | 'recovered' | 'failed'

type BridgeMessage =
  | { type: 'klappay:ready'; requestId: string }
  | { type: 'klappay:resize'; requestId: string; height: number }
  | { type: 'klappay:pending'; requestId: string }
  | { type: 'klappay:confirming'; requestId: string; txHash: string; network: string }
  | { type: 'klappay:success'; requestId: string; result: PaymentResult }
  | { type: 'klappay:error'; requestId: string; error: KlappayOneError }
  | { type: 'klappay:cancel'; requestId: string }
  | { type: 'klappay:reconnecting'; requestId: string; state: ReconnectState }

export const READY_TIMEOUT_MS = 10_000

export interface BridgeHandlers {
  onReady?: () => void
  onPending?: () => void
  onConfirming?: (data: { txHash: string; network: string }) => void
  onSuccess?: (result: PaymentResult) => void
  onError?: (error: KlappayOneError) => void
  // A bridge-sourced cancel only ever comes from the in-page Cancel
  // button (web/src/lib/bridge.ts's sendCancel in klap-one) — always
  // 'user'. The other possible reason, 'closed', is synthesized entirely
  // outside this module by core/klappay-one.ts's popup-closed poll, which
  // never receives a bridge message at all.
  onCancel?: (reason: 'user' | 'closed') => void
  onTimeout?: () => void
  onResize?: (height: number) => void
  // Fired when one-id detects the WalletConnect relay connection may have
  // dropped after the tab/iframe returns from being backgrounded (the
  // payer switched to their wallet app to approve, then came back) and
  // again once it resolves. Purely informational, like onPending/
  // onConfirming — never terminal, never wrapped in a settled guard by
  // callers.
  onReconnecting?: (state: ReconnectState) => void
}

const RECONNECT_STATES: readonly ReconnectState[] = ['started', 'recovered', 'failed']

function isPaymentResult(value: unknown): value is PaymentResult {
  if (typeof value !== 'object' || value === null) return false
  const result = value as Record<string, unknown>
  return (
    typeof result.txHash === 'string' &&
    typeof result.walletAddress === 'string' &&
    typeof result.network === 'string' &&
    typeof result.amount === 'string' &&
    typeof result.confirmedAt === 'string'
  )
}

function isKlappayOneError(value: unknown): value is KlappayOneError {
  if (typeof value !== 'object' || value === null) return false
  const error = value as Record<string, unknown>
  return typeof error.code === 'string' && typeof error.message === 'string'
}

// Validates every field the matching BridgeMessage variant actually
// carries, not just the type/requestId envelope shared by all of them —
// an audit found that only checking those two left the rest of the
// (compile-time-only) discriminated union with zero runtime backing, so
// e.g. an arbitrary `state` string on `klappay:reconnecting` flowed
// straight through to a caller's handler typed to expect one of three
// literals.
function isBridgeMessage(data: unknown): data is BridgeMessage {
  if (typeof data !== 'object' || data === null) return false
  const envelope = data as Record<string, unknown>
  if (typeof envelope.type !== 'string' || typeof envelope.requestId !== 'string') return false

  switch (envelope.type) {
    case 'klappay:ready':
    case 'klappay:pending':
    case 'klappay:cancel':
      return true
    case 'klappay:resize':
      return typeof envelope.height === 'number'
    case 'klappay:confirming':
      return typeof envelope.txHash === 'string' && typeof envelope.network === 'string'
    case 'klappay:success':
      return isPaymentResult(envelope.result)
    case 'klappay:error':
      return isKlappayOneError(envelope.error)
    case 'klappay:reconnecting':
      // No `as` here on purpose — `envelope.state` is exactly the
      // unvalidated value this check exists to prove, so it's narrowed
      // with typeof first; only the already-known-correct `string[]` view
      // of RECONNECT_STATES is cast, never the unproven data itself.
      return (
        typeof envelope.state === 'string' &&
        (RECONNECT_STATES as readonly string[]).includes(envelope.state)
      )
    default:
      return false
  }
}

export function listen(
  klapOneOrigin: string,
  requestId: string,
  handlers: BridgeHandlers,
): () => void {
  let ready = false
  // Cheap insurance against a misbehaving one-id release (or a spoofed
  // co-resident sender, see docs/protocol.md) flooding identical
  // reconnect states — never gated by settleOnce like a terminal outcome
  // would be, just skips a redundant callback for the same state twice
  // in a row.
  let lastReconnectState: ReconnectState | undefined

  const timeout = setTimeout(() => {
    if (!ready) handlers.onTimeout?.()
  }, READY_TIMEOUT_MS)

  function onMessage(event: MessageEvent): void {
    if (event.origin !== klapOneOrigin) return
    if (!isBridgeMessage(event.data) || event.data.requestId !== requestId) return

    const message = event.data
    switch (message.type) {
      case 'klappay:ready':
        ready = true
        clearTimeout(timeout)
        handlers.onReady?.()
        return
      case 'klappay:success':
        handlers.onSuccess?.(message.result)
        return
      case 'klappay:error':
        handlers.onError?.(message.error)
        return
      case 'klappay:cancel':
        handlers.onCancel?.('user')
        return
      case 'klappay:pending':
        handlers.onPending?.()
        return
      case 'klappay:confirming':
        handlers.onConfirming?.({ txHash: message.txHash, network: message.network })
        return
      case 'klappay:resize':
        handlers.onResize?.(message.height)
        return
      case 'klappay:reconnecting':
        if (message.state === lastReconnectState) return
        lastReconnectState = message.state
        handlers.onReconnecting?.(message.state)
        return
    }
  }

  window.addEventListener('message', onMessage)

  return () => {
    clearTimeout(timeout)
    window.removeEventListener('message', onMessage)
  }
}

export interface FrameUrlParams {
  klapOneOrigin: string
  chargeId: string
  requestId: string
  locale?: string
}

// Shared by both rendering modes (core/popup.ts and core/iframe.ts) — the
// URL/query-param contract is identical either way, only how the result
// gets mounted differs.
export function buildFrameUrl(params: FrameUrlParams): string {
  const url = new URL('/id/', params.klapOneOrigin)
  url.searchParams.set('chargeId', params.chargeId)
  url.searchParams.set('requestId', params.requestId)
  url.searchParams.set('returnOrigin', window.location.origin)
  if (params.locale) url.searchParams.set('locale', params.locale)
  return url.toString()
}
