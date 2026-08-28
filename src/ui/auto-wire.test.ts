import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as klappayOneModule from '../core/klappay-one'
import {
  AUTO_WIRE_ATTRIBUTE,
  AUTO_WIRE_MODE_ATTRIBUTE,
  AUTO_WIRE_ORIGIN_ATTRIBUTE,
  observeNewElements,
  wireExisting,
} from './auto-wire'

vi.mock('../core/klappay-one', async (importOriginal) => {
  const actual = await importOriginal<typeof klappayOneModule>()
  return { ...actual, createKlappayOne: vi.fn() }
})

describe('auto-wire', () => {
  beforeEach(() => {
    klappayOneModule.configure({})
    vi.mocked(klappayOneModule.createKlappayOne).mockReturnValue({ open: vi.fn() })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('wires a click handler that opens with the element attribute values', () => {
    document.body.innerHTML = `<button ${AUTO_WIRE_ATTRIBUTE}="ch_123" ${AUTO_WIRE_ORIGIN_ATTRIBUTE}="https://one.klappay.com">Pay</button>`
    wireExisting()

    document.querySelector('button')?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledWith(
      expect.objectContaining({ chargeId: 'ch_123', origin: 'https://one.klappay.com' }),
    )
  })

  it('passes a valid mode attribute through to createKlappayOne', () => {
    document.body.innerHTML = `<button ${AUTO_WIRE_ATTRIBUTE}="ch_123" ${AUTO_WIRE_ORIGIN_ATTRIBUTE}="https://one.klappay.com" ${AUTO_WIRE_MODE_ATTRIBUTE}="popup">Pay</button>`
    wireExisting()

    document.querySelector('button')?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'popup' }),
    )
  })

  it('ignores an invalid mode attribute', () => {
    document.body.innerHTML = `<button ${AUTO_WIRE_ATTRIBUTE}="ch_123" ${AUTO_WIRE_ORIGIN_ATTRIBUTE}="https://one.klappay.com" ${AUTO_WIRE_MODE_ATTRIBUTE}="bogus">Pay</button>`
    wireExisting()

    document.querySelector('button')?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledWith(
      expect.objectContaining({ mode: undefined }),
    )
  })

  it('dispatches success/error/cancel DOM events from the underlying callbacks', () => {
    document.body.innerHTML = `<button ${AUTO_WIRE_ATTRIBUTE}="ch_123" ${AUTO_WIRE_ORIGIN_ATTRIBUTE}="https://one.klappay.com">Pay</button>`
    wireExisting()
    const button = document.querySelector('button')
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const onCancel = vi.fn()
    button?.addEventListener('success', onSuccess)
    button?.addEventListener('error', onError)
    button?.addEventListener('cancel', onCancel)

    button?.click()
    const passedConfig = vi.mocked(klappayOneModule.createKlappayOne).mock.calls[0]?.[0]

    const result = {
      txHash: '0xabc',
      walletAddress: '0xdef',
      network: 'base-sepolia',
      amount: '10.00',
      confirmedAt: '2026-08-27T00:00:00.000Z',
    }
    passedConfig?.onSuccess?.(result)
    passedConfig?.onError?.({ code: 'payment_failed', message: 'nope' })
    passedConfig?.onCancel?.()

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('ignores a second click while a checkout is already in flight', () => {
    document.body.innerHTML = `<button ${AUTO_WIRE_ATTRIBUTE}="ch_123" ${AUTO_WIRE_ORIGIN_ATTRIBUTE}="https://one.klappay.com">Pay</button>`
    wireExisting()
    const button = document.querySelector('button')

    button?.click()
    button?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledTimes(1)
  })

  it('allows a new checkout once the previous one settles', () => {
    document.body.innerHTML = `<button ${AUTO_WIRE_ATTRIBUTE}="ch_123" ${AUTO_WIRE_ORIGIN_ATTRIBUTE}="https://one.klappay.com">Pay</button>`
    wireExisting()
    const button = document.querySelector('button')

    button?.click()
    const passedConfig = vi.mocked(klappayOneModule.createKlappayOne).mock.calls[0]?.[0]
    passedConfig?.onCancel?.()
    button?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledTimes(2)
  })

  it('does not double-wire an element that is scanned twice', () => {
    document.body.innerHTML = `<button ${AUTO_WIRE_ATTRIBUTE}="ch_123" ${AUTO_WIRE_ORIGIN_ATTRIBUTE}="https://one.klappay.com">Pay</button>`
    wireExisting()
    wireExisting()

    document.querySelector('button')?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledTimes(1)
  })

  it('logs an error and does not open when no origin is configured', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    document.body.innerHTML = `<button ${AUTO_WIRE_ATTRIBUTE}="ch_123">Pay</button>`
    wireExisting()

    document.querySelector('button')?.click()

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('origin'))
    expect(klappayOneModule.createKlappayOne).not.toHaveBeenCalled()
  })

  it('falls back to the globally configured origin/locale', () => {
    klappayOneModule.configure({ origin: 'https://one.klappay.com', locale: 'pt-BR' })
    document.body.innerHTML = `<button ${AUTO_WIRE_ATTRIBUTE}="ch_123">Pay</button>`
    wireExisting()

    document.querySelector('button')?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledWith(
      expect.objectContaining({ origin: 'https://one.klappay.com', locale: 'pt-BR' }),
    )
  })

  it('wires elements added to the DOM after observation starts', async () => {
    const stop = observeNewElements()
    const button = document.createElement('button')
    button.setAttribute(AUTO_WIRE_ATTRIBUTE, 'ch_123')
    button.setAttribute(AUTO_WIRE_ORIGIN_ATTRIBUTE, 'https://one.klappay.com')
    document.body.append(button)

    await new Promise((resolve) => setTimeout(resolve, 10))
    button.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledTimes(1)
    stop()
  })

  it('stops wiring new elements once disconnected', async () => {
    const stop = observeNewElements()
    stop()

    const button = document.createElement('button')
    button.setAttribute(AUTO_WIRE_ATTRIBUTE, 'ch_123')
    button.setAttribute(AUTO_WIRE_ORIGIN_ATTRIBUTE, 'https://one.klappay.com')
    document.body.append(button)

    await new Promise((resolve) => setTimeout(resolve, 10))
    button.click()

    expect(klappayOneModule.createKlappayOne).not.toHaveBeenCalled()
  })
})
