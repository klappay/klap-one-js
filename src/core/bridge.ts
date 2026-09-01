import type { KlappayOneError, PaymentResult } from './types'

// Mirrors web/src/lib/bridge.ts in klap-one — the canonical wire format
// is defined once in this repo's own docs/protocol.md; keep the two in
// sync manually, there's no shared package between the two repos to
// enforce it.
type BridgeMessage =
  | { type: 'klappay:ready'; requestId: string }
  | { type: 'klappay:resize'; requestId: string; height: number }
  | { type: 'klappay:pending'; requestId: string }
  | { type: 'klappay:confirming'; requestId: string; txHash: string; network: string }
  | { type: 'klappay:success'; requestId: string; result: PaymentResult }
  | { type: 'klappay:error'; requestId: string; error: KlappayOneError }
  | { type: 'klappay:cancel'; requestId: string }

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
}

function isBridgeMessage(data: unknown): data is BridgeMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    typeof (data as { type: unknown }).type === 'string' &&
    (data as { type: string }).type.startsWith('klappay:') &&
    'requestId' in data &&
    typeof (data as { requestId: unknown }).requestId === 'string'
  )
}

export function listen(
  klapOneOrigin: string,
  requestId: string,
  handlers: BridgeHandlers,
): () => void {
  let ready = false

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
