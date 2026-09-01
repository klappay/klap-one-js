import { buildFrameUrl, listen } from './bridge'
import { openIframe } from './iframe'
import { isPopupClosed, openPopup } from './popup'
import type { KlappayOne, KlappayOneConfig } from './types'

const POPUP_BLOCKED = { code: 'POPUP_BLOCKED', message: 'The Klappay One popup was blocked.' }
const FRAME_TIMEOUT = {
  code: 'FRAME_TIMEOUT',
  message: 'The Klappay One popup did not respond in time.',
}

// one-id only ever calls sendCancel() from an explicit in-page Cancel
// button (web/src/pages/sign.ts) — closing the popup any other way (the
// browser's own close button, alt-F4, swiping it away) reaches no such
// code and would otherwise leave onCancel never firing. Polling
// popup.closed is the same fallback OAuth-popup libraries use for
// exactly this reason: a child page's unload handler isn't guaranteed to
// run, especially for a cross-origin popup this app doesn't control.
const POPUP_CLOSED_POLL_MS = 500

// `ui/klappay-button.ts` and `ui/auto-wire.ts` render from plain HTML
// attributes and have nowhere natural to require an `origin` on every
// element — `configure()` lets a page set it once. `createKlappayOne`
// itself still requires `origin` explicitly: the programmatic API has no
// such excuse.
export interface GlobalConfig {
  origin?: string
  locale?: string
}

let globalConfig: GlobalConfig = {}

export function configure(config: GlobalConfig): void {
  globalConfig = config
}

export function getGlobalConfig(): GlobalConfig {
  return globalConfig
}

// iframe/modal is the unconditional default on every device now — mobile
// used to default to popup instead, out of an unverified concern that a
// backgrounded iframe's WalletConnect relay connection wouldn't survive
// the OS switching to the wallet app and back (see the reconnect
// handling this module now wires through onReconnecting, and
// docs/modes.md). A popup tab turned out to have no real protection
// against that either — the browser freezes an entire backgrounded tab's
// frame tree together, popup or iframe alike — so this only changes
// which renderer is chosen by default, not what protects a checkout from
// backgrounding. `mode` still forces either one explicitly.
function resolveMode(config: KlappayOneConfig): 'iframe' | 'popup' {
  return config.mode ?? 'iframe'
}

export function createKlappayOne(config: KlappayOneConfig): KlappayOne {
  function open(): void {
    if (resolveMode(config) === 'popup') {
      openViaPopup()
    } else {
      openViaIframe()
    }
  }

  function openViaPopup(): void {
    const requestId = crypto.randomUUID()
    const url = buildFrameUrl({
      klapOneOrigin: config.origin,
      chargeId: config.chargeId,
      requestId,
      locale: config.locale,
    })

    const popup = openPopup(url)
    if (isPopupClosed(popup)) {
      config.onError?.(POPUP_BLOCKED)
      return
    }

    const stopListening = listen(config.origin, requestId, {
      onReady: config.onReady,
      onPending: config.onPending,
      onConfirming: config.onConfirming,
      onSuccess: (result) => {
        stop()
        config.onSuccess?.(result)
      },
      onError: (error) => {
        stop()
        config.onError?.(error)
      },
      onCancel: (reason) => {
        stop()
        config.onCancel?.(reason)
      },
      onTimeout: () => {
        stop()
        config.onError?.(FRAME_TIMEOUT)
      },
      // A popup tab is exactly as exposed to backgrounding as an iframe
      // is (see resolveMode's comment above) — never gated to the iframe
      // path only.
      onReconnecting: config.onReconnecting,
    })

    const pollClosed = setInterval(() => {
      if (isPopupClosed(popup)) {
        stop()
        config.onCancel?.('closed')
      }
    }, POPUP_CLOSED_POLL_MS)

    function stop(): void {
      clearInterval(pollClosed)
      stopListening()
    }
  }

  function openViaIframe(): void {
    const requestId = crypto.randomUUID()
    const url = buildFrameUrl({
      klapOneOrigin: config.origin,
      chargeId: config.chargeId,
      requestId,
      locale: config.locale,
    })

    // A backdrop dismiss and a genuine bridge message can race (e.g. the
    // dismiss click lands the same tick a cancel/success message arrives)
    // — settled guards config's callbacks from ever firing twice for one
    // checkout, no matter which trigger gets there first.
    let settled = false
    function settleOnce(run: () => void): void {
      if (settled) return
      settled = true
      stop()
      run()
    }

    const frame = openIframe(url, () => settleOnce(() => config.onCancel?.('user')))

    const stopListening = listen(config.origin, requestId, {
      onReady: config.onReady,
      // Not wrapped in settleOnce — this isn't a terminal outcome, and the
      // payment is now past the point where a backdrop dismiss should be
      // allowed to silently orphan it.
      onPending: () => {
        frame.setDismissable(false)
        config.onPending?.()
      },
      onConfirming: config.onConfirming,
      onSuccess: (result) => settleOnce(() => config.onSuccess?.(result)),
      onError: (error) => settleOnce(() => config.onError?.(error)),
      onCancel: (reason) => settleOnce(() => config.onCancel?.(reason)),
      onResize: (height) => frame.resize(height),
      // A merchant CSP blocking frame-src/child-src for this domain would
      // otherwise leave the iframe silently blank forever — one automatic
      // fallback to the popup renderer before giving up and reporting
      // FRAME_TIMEOUT (which openViaPopup does on its own if it also fails).
      onTimeout: () => settleOnce(openViaPopup),
      // Not wrapped in settleOnce — like onPending/onConfirming, this is
      // informational, never terminal. one-id drives this autonomously
      // once it detects its own WalletConnect relay coming back from a
      // background/foreground cycle; nothing here needs to send anything
      // back into the iframe for it to act on.
      onReconnecting: config.onReconnecting,
    })

    function stop(): void {
      stopListening()
      frame.close()
    }
  }

  return { open }
}
