import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { READY_TIMEOUT_MS, buildFrameUrl, listen } from './bridge'

describe('buildFrameUrl', () => {
  it('builds the popup URL with all params set', () => {
    const url = buildFrameUrl({
      klapOneOrigin: 'https://one.klappay.com',
      chargeId: 'ch_123',
      requestId: 'req_abc',
      locale: 'pt-BR',
    })
    const parsed = new URL(url)

    expect(parsed.origin).toBe('https://one.klappay.com')
    expect(parsed.pathname).toBe('/id/')
    expect(parsed.searchParams.get('chargeId')).toBe('ch_123')
    expect(parsed.searchParams.get('requestId')).toBe('req_abc')
    expect(parsed.searchParams.get('locale')).toBe('pt-BR')
    expect(parsed.searchParams.get('returnOrigin')).toBe(window.location.origin)
  })

  it('escapes special characters in chargeId/requestId', () => {
    const url = buildFrameUrl({
      klapOneOrigin: 'https://one.klappay.com',
      chargeId: 'ch 123&x=1',
      requestId: 'req/abc?y=2',
    })
    const parsed = new URL(url)

    expect(parsed.searchParams.get('chargeId')).toBe('ch 123&x=1')
    expect(parsed.searchParams.get('requestId')).toBe('req/abc?y=2')
  })

  it('omits locale when not provided', () => {
    const url = buildFrameUrl({
      klapOneOrigin: 'https://one.klappay.com',
      chargeId: 'ch_123',
      requestId: 'req_abc',
    })
    const parsed = new URL(url)

    expect(parsed.searchParams.has('locale')).toBe(false)
  })
})

describe('listen', () => {
  const klapOneOrigin = 'https://one.klappay.com'
  const requestId = 'req_abc'

  function dispatch(origin: string, data: unknown): void {
    window.dispatchEvent(new MessageEvent('message', { origin, data }))
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ignores messages from the wrong origin', () => {
    const onReady = vi.fn()
    const stop = listen(klapOneOrigin, requestId, { onReady })

    dispatch('https://evil.example', { type: 'klappay:ready', requestId })

    expect(onReady).not.toHaveBeenCalled()
    stop()
  })

  it('ignores messages with a mismatched requestId', () => {
    const onReady = vi.fn()
    const stop = listen(klapOneOrigin, requestId, { onReady })

    dispatch(klapOneOrigin, { type: 'klappay:ready', requestId: 'req_other' })

    expect(onReady).not.toHaveBeenCalled()
    stop()
  })

  it('calls onReady and clears the timeout once ready arrives', () => {
    const onReady = vi.fn()
    const onTimeout = vi.fn()
    const stop = listen(klapOneOrigin, requestId, { onReady, onTimeout })

    dispatch(klapOneOrigin, { type: 'klappay:ready', requestId })
    vi.advanceTimersByTime(READY_TIMEOUT_MS)

    expect(onReady).toHaveBeenCalledTimes(1)
    expect(onTimeout).not.toHaveBeenCalled()
    stop()
  })

  it('calls onTimeout if ready never arrives', () => {
    const onTimeout = vi.fn()
    const stop = listen(klapOneOrigin, requestId, { onTimeout })

    vi.advanceTimersByTime(READY_TIMEOUT_MS)

    expect(onTimeout).toHaveBeenCalledTimes(1)
    stop()
  })

  it('routes success/error/cancel to their handlers', () => {
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const onCancel = vi.fn()
    const stop = listen(klapOneOrigin, requestId, { onSuccess, onError, onCancel })

    const result = {
      txHash: '0xabc',
      walletAddress: '0xdef',
      network: 'base-sepolia',
      amount: '10.00',
      confirmedAt: '2026-08-27T00:00:00.000Z',
    }
    dispatch(klapOneOrigin, { type: 'klappay:success', requestId, result })
    expect(onSuccess).toHaveBeenCalledWith(result)

    const error = { code: 'payment_failed', message: 'insufficient funds' }
    dispatch(klapOneOrigin, { type: 'klappay:error', requestId, error })
    expect(onError).toHaveBeenCalledWith(error)

    dispatch(klapOneOrigin, { type: 'klappay:cancel', requestId })
    expect(onCancel).toHaveBeenCalledWith('user')

    stop()
  })

  it('routes pending to its handler', () => {
    const onPending = vi.fn()
    const stop = listen(klapOneOrigin, requestId, { onPending })

    dispatch(klapOneOrigin, { type: 'klappay:pending', requestId })

    expect(onPending).toHaveBeenCalledTimes(1)
    stop()
  })

  it('routes confirming to its handler', () => {
    const onConfirming = vi.fn()
    const stop = listen(klapOneOrigin, requestId, { onConfirming })

    dispatch(klapOneOrigin, {
      type: 'klappay:confirming',
      requestId,
      txHash: '0xabc',
      network: 'base',
    })

    expect(onConfirming).toHaveBeenCalledWith({ txHash: '0xabc', network: 'base' })
    stop()
  })

  it('routes resize to its handler', () => {
    const onResize = vi.fn()
    const stop = listen(klapOneOrigin, requestId, { onResize })

    dispatch(klapOneOrigin, { type: 'klappay:resize', requestId, height: 640 })

    expect(onResize).toHaveBeenCalledWith(640)
    stop()
  })

  it('stops listening and cancels the timeout after stop() is called', () => {
    const onReady = vi.fn()
    const onTimeout = vi.fn()
    const stop = listen(klapOneOrigin, requestId, { onReady, onTimeout })

    stop()
    dispatch(klapOneOrigin, { type: 'klappay:ready', requestId })
    vi.advanceTimersByTime(READY_TIMEOUT_MS)

    expect(onReady).not.toHaveBeenCalled()
    expect(onTimeout).not.toHaveBeenCalled()
  })
})
