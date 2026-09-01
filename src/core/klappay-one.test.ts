import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as bridge from './bridge'
import type { BridgeHandlers } from './bridge'
import * as device from './device'
import * as iframeModule from './iframe'
import { configure, createKlappayOne, getGlobalConfig } from './klappay-one'
import * as popup from './popup'

vi.mock('./bridge', () => ({
  buildFrameUrl: vi.fn(() => 'https://one.klappay.com/id/?chargeId=ch_123&requestId=req_1'),
  listen: vi.fn(),
}))

vi.mock('./popup', () => ({
  openPopup: vi.fn(),
  isPopupClosed: vi.fn(),
}))

vi.mock('./iframe', () => ({
  openIframe: vi.fn(),
}))

vi.mock('./device', () => ({
  isMobileUserAgent: vi.fn(),
}))

// Fake timers so createKlappayOne's popup-closed poll interval never
// ticks unless a test explicitly advances it — otherwise it keeps
// running against the shared mocks after its own test finishes.
beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.mocked(device.isMobileUserAgent).mockReturnValue(false)
  vi.mocked(iframeModule.openIframe).mockReturnValue({
    close: vi.fn(),
    resize: vi.fn(),
    setDismissable: vi.fn(),
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('configure/getGlobalConfig', () => {
  it('returns an empty config before configure() is called', () => {
    expect(getGlobalConfig()).toEqual({})
  })

  it('stores and returns whatever configure() was given', () => {
    configure({ origin: 'https://one.klappay.com', locale: 'pt-BR' })

    expect(getGlobalConfig()).toEqual({ origin: 'https://one.klappay.com', locale: 'pt-BR' })
  })
})

describe('createKlappayOne — mode selection', () => {
  const config = { chargeId: 'ch_123', origin: 'https://one.klappay.com' }

  it('opens via iframe on desktop by default', () => {
    vi.mocked(device.isMobileUserAgent).mockReturnValue(false)

    createKlappayOne(config).open()

    expect(iframeModule.openIframe).toHaveBeenCalledTimes(1)
    expect(popup.openPopup).not.toHaveBeenCalled()
  })

  it('opens via popup on mobile by default', () => {
    vi.mocked(device.isMobileUserAgent).mockReturnValue(true)
    vi.mocked(popup.openPopup).mockReturnValue({ closed: false } as Window)
    vi.mocked(popup.isPopupClosed).mockReturnValue(false)

    createKlappayOne(config).open()

    expect(popup.openPopup).toHaveBeenCalledTimes(1)
    expect(iframeModule.openIframe).not.toHaveBeenCalled()
  })

  it('an explicit mode overrides the mobile/desktop default', () => {
    vi.mocked(device.isMobileUserAgent).mockReturnValue(false)
    vi.mocked(popup.openPopup).mockReturnValue({ closed: false } as Window)
    vi.mocked(popup.isPopupClosed).mockReturnValue(false)

    createKlappayOne({ ...config, mode: 'popup' }).open()

    expect(popup.openPopup).toHaveBeenCalledTimes(1)
    expect(iframeModule.openIframe).not.toHaveBeenCalled()
  })
})

describe('createKlappayOne — popup mode', () => {
  const config = { chargeId: 'ch_123', origin: 'https://one.klappay.com', mode: 'popup' as const }

  function capturedHandlers(): BridgeHandlers {
    const calls = vi.mocked(bridge.listen).mock.calls
    return calls[calls.length - 1]?.[2] as BridgeHandlers
  }

  it('reports POPUP_BLOCKED and never listens when the popup was blocked', () => {
    vi.mocked(popup.openPopup).mockReturnValue(null)
    vi.mocked(popup.isPopupClosed).mockReturnValue(true)
    const onError = vi.fn()

    createKlappayOne({ ...config, onError }).open()

    expect(onError).toHaveBeenCalledWith({
      code: 'POPUP_BLOCKED',
      message: 'The Klappay One popup was blocked.',
    })
    expect(bridge.listen).not.toHaveBeenCalled()
  })

  it('listens for bridge messages once the popup opens', () => {
    const fakePopup = { closed: false } as Window
    vi.mocked(popup.openPopup).mockReturnValue(fakePopup)
    vi.mocked(popup.isPopupClosed).mockReturnValue(false)
    const stop = vi.fn()
    vi.mocked(bridge.listen).mockReturnValue(stop)

    createKlappayOne(config).open()

    expect(bridge.listen).toHaveBeenCalledWith(
      config.origin,
      expect.any(String),
      expect.objectContaining({
        onReady: undefined,
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
        onCancel: expect.any(Function),
        onTimeout: expect.any(Function),
      }),
    )
  })

  it('forwards onSuccess and stops listening', () => {
    const fakePopup = { closed: false } as Window
    vi.mocked(popup.openPopup).mockReturnValue(fakePopup)
    vi.mocked(popup.isPopupClosed).mockReturnValue(false)
    const stop = vi.fn()
    vi.mocked(bridge.listen).mockReturnValue(stop)
    const onSuccess = vi.fn()

    createKlappayOne({ ...config, onSuccess }).open()
    const result = {
      txHash: '0xabc',
      walletAddress: '0xdef',
      network: 'base-sepolia',
      amount: '10.00',
      confirmedAt: '2026-08-27T00:00:00.000Z',
    }
    capturedHandlers().onSuccess?.(result)

    expect(stop).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(result)
  })

  it('forwards onCancel and stops listening', () => {
    const fakePopup = { closed: false } as Window
    vi.mocked(popup.openPopup).mockReturnValue(fakePopup)
    vi.mocked(popup.isPopupClosed).mockReturnValue(false)
    const stop = vi.fn()
    vi.mocked(bridge.listen).mockReturnValue(stop)
    const onCancel = vi.fn()

    createKlappayOne({ ...config, onCancel }).open()
    capturedHandlers().onCancel?.('user')

    expect(stop).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledWith('user')
  })

  it('forwards onPending without stopping or settling', () => {
    const fakePopup = { closed: false } as Window
    vi.mocked(popup.openPopup).mockReturnValue(fakePopup)
    vi.mocked(popup.isPopupClosed).mockReturnValue(false)
    const stop = vi.fn()
    vi.mocked(bridge.listen).mockReturnValue(stop)
    const onPending = vi.fn()

    createKlappayOne({ ...config, onPending }).open()
    capturedHandlers().onPending?.()

    expect(onPending).toHaveBeenCalledTimes(1)
    expect(stop).not.toHaveBeenCalled()
  })

  it('calls onCancel when the popup is closed without a bridge message', () => {
    const fakePopup = { closed: false } as Window
    vi.mocked(popup.openPopup).mockReturnValue(fakePopup)
    vi.mocked(popup.isPopupClosed).mockReturnValue(false)
    const stop = vi.fn()
    vi.mocked(bridge.listen).mockReturnValue(stop)
    const onCancel = vi.fn()

    createKlappayOne({ ...config, onCancel }).open()
    vi.mocked(popup.isPopupClosed).mockReturnValue(true)
    vi.advanceTimersByTime(500)

    expect(stop).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledWith('closed')
  })

  it('does not poll for a closed popup once a bridge message already settled it', () => {
    const fakePopup = { closed: false } as Window
    vi.mocked(popup.openPopup).mockReturnValue(fakePopup)
    vi.mocked(popup.isPopupClosed).mockReturnValue(false)
    const stop = vi.fn()
    vi.mocked(bridge.listen).mockReturnValue(stop)
    const onCancel = vi.fn()
    const onSuccess = vi.fn()

    createKlappayOne({ ...config, onSuccess, onCancel }).open()
    capturedHandlers().onSuccess?.({
      txHash: '0xabc',
      walletAddress: '0xdef',
      network: 'base-sepolia',
      amount: '10.00',
      confirmedAt: '2026-08-27T00:00:00.000Z',
    })

    vi.mocked(popup.isPopupClosed).mockReturnValue(true)
    vi.advanceTimersByTime(5_000)

    expect(onCancel).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('reports FRAME_TIMEOUT and stops listening on timeout', () => {
    const fakePopup = { closed: false } as Window
    vi.mocked(popup.openPopup).mockReturnValue(fakePopup)
    vi.mocked(popup.isPopupClosed).mockReturnValue(false)
    const stop = vi.fn()
    vi.mocked(bridge.listen).mockReturnValue(stop)
    const onError = vi.fn()

    createKlappayOne({ ...config, onError }).open()
    capturedHandlers().onTimeout?.()

    expect(stop).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith({
      code: 'FRAME_TIMEOUT',
      message: 'The Klappay One popup did not respond in time.',
    })
  })
})

describe('createKlappayOne — iframe mode', () => {
  const config = { chargeId: 'ch_123', origin: 'https://one.klappay.com', mode: 'iframe' as const }

  function capturedHandlers(): BridgeHandlers {
    const calls = vi.mocked(bridge.listen).mock.calls
    return calls[calls.length - 1]?.[2] as BridgeHandlers
  }

  it('forwards onSuccess and closes the frame', () => {
    const frame = { close: vi.fn(), resize: vi.fn(), setDismissable: vi.fn() }
    vi.mocked(iframeModule.openIframe).mockReturnValue(frame)
    const stop = vi.fn()
    vi.mocked(bridge.listen).mockReturnValue(stop)
    const onSuccess = vi.fn()

    createKlappayOne({ ...config, onSuccess }).open()
    const result = {
      txHash: '0xabc',
      walletAddress: '0xdef',
      network: 'base-sepolia',
      amount: '10.00',
      confirmedAt: '2026-08-27T00:00:00.000Z',
    }
    capturedHandlers().onSuccess?.(result)

    expect(stop).toHaveBeenCalledTimes(1)
    expect(frame.close).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(result)
  })

  it('resizes the frame on klappay:resize', () => {
    const frame = { close: vi.fn(), resize: vi.fn(), setDismissable: vi.fn() }
    vi.mocked(iframeModule.openIframe).mockReturnValue(frame)
    vi.mocked(bridge.listen).mockReturnValue(vi.fn())

    createKlappayOne(config).open()
    capturedHandlers().onResize?.(640)

    expect(frame.resize).toHaveBeenCalledWith(640)
  })

  it('calls onCancel and closes the frame when the backdrop is dismissed', () => {
    const frame = { close: vi.fn(), resize: vi.fn(), setDismissable: vi.fn() }
    let onDismiss: (() => void) | undefined
    vi.mocked(iframeModule.openIframe).mockImplementation((_url, dismiss) => {
      onDismiss = dismiss
      return frame
    })
    vi.mocked(bridge.listen).mockReturnValue(vi.fn())
    const onCancel = vi.fn()

    createKlappayOne({ ...config, onCancel }).open()
    onDismiss?.()

    expect(frame.close).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledWith('user')
  })

  it('forwards onPending and disables backdrop dismissal, without settling', () => {
    const frame = { close: vi.fn(), resize: vi.fn(), setDismissable: vi.fn() }
    vi.mocked(iframeModule.openIframe).mockReturnValue(frame)
    vi.mocked(bridge.listen).mockReturnValue(vi.fn())
    const onPending = vi.fn()

    createKlappayOne({ ...config, onPending }).open()
    capturedHandlers().onPending?.()

    expect(onPending).toHaveBeenCalledTimes(1)
    expect(frame.setDismissable).toHaveBeenCalledWith(false)
    expect(frame.close).not.toHaveBeenCalled()
  })

  it('only forwards onCancel once when the backdrop dismiss fires twice for one click', () => {
    const frame = { close: vi.fn(), resize: vi.fn(), setDismissable: vi.fn() }
    let onDismiss: (() => void) | undefined
    vi.mocked(iframeModule.openIframe).mockImplementation((_url, dismiss) => {
      onDismiss = dismiss
      return frame
    })
    vi.mocked(bridge.listen).mockReturnValue(vi.fn())
    const onCancel = vi.fn()

    createKlappayOne({ ...config, onCancel }).open()
    onDismiss?.()
    onDismiss?.()

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('only forwards one outcome when a dismiss and a bridge message race', () => {
    const frame = { close: vi.fn(), resize: vi.fn(), setDismissable: vi.fn() }
    let onDismiss: (() => void) | undefined
    vi.mocked(iframeModule.openIframe).mockImplementation((_url, dismiss) => {
      onDismiss = dismiss
      return frame
    })
    vi.mocked(bridge.listen).mockReturnValue(vi.fn())
    const onCancel = vi.fn()
    const onSuccess = vi.fn()

    createKlappayOne({ ...config, onSuccess, onCancel }).open()
    onDismiss?.()
    capturedHandlers().onSuccess?.({
      txHash: '0xabc',
      walletAddress: '0xdef',
      network: 'base-sepolia',
      amount: '10.00',
      confirmedAt: '2026-08-27T00:00:00.000Z',
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('only forwards one outcome when the race goes the other way (message, then dismiss)', () => {
    const frame = { close: vi.fn(), resize: vi.fn(), setDismissable: vi.fn() }
    let onDismiss: (() => void) | undefined
    vi.mocked(iframeModule.openIframe).mockImplementation((_url, dismiss) => {
      onDismiss = dismiss
      return frame
    })
    vi.mocked(bridge.listen).mockReturnValue(vi.fn())
    const onCancel = vi.fn()
    const onSuccess = vi.fn()

    createKlappayOne({ ...config, onSuccess, onCancel }).open()
    capturedHandlers().onSuccess?.({
      txHash: '0xabc',
      walletAddress: '0xdef',
      network: 'base-sepolia',
      amount: '10.00',
      confirmedAt: '2026-08-27T00:00:00.000Z',
    })
    onDismiss?.()

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('falls back to popup once when the iframe never signals ready', () => {
    const frame = { close: vi.fn(), resize: vi.fn(), setDismissable: vi.fn() }
    vi.mocked(iframeModule.openIframe).mockReturnValue(frame)
    vi.mocked(bridge.listen).mockReturnValueOnce(vi.fn())
    vi.mocked(popup.openPopup).mockReturnValue({ closed: false } as Window)
    vi.mocked(popup.isPopupClosed).mockReturnValue(false)
    vi.mocked(bridge.listen).mockReturnValueOnce(vi.fn())

    createKlappayOne(config).open()
    const [, , iframeHandlers] = vi.mocked(bridge.listen).mock.calls[0] as [
      string,
      string,
      BridgeHandlers,
    ]
    iframeHandlers.onTimeout?.()

    expect(frame.close).toHaveBeenCalledTimes(1)
    expect(popup.openPopup).toHaveBeenCalledTimes(1)
    expect(bridge.listen).toHaveBeenCalledTimes(2)
  })
})
