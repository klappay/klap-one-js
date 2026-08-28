import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as klappayOneModule from '../core/klappay-one'
import { KLAPPAY_BUTTON_TAG, registerKlappayButton } from './klappay-button'

vi.mock('../core/klappay-one', async (importOriginal) => {
  const actual = await importOriginal<typeof klappayOneModule>()
  return { ...actual, createKlappayOne: vi.fn() }
})

describe('klappay-button', () => {
  beforeEach(() => {
    registerKlappayButton()
    klappayOneModule.configure({})
    vi.mocked(klappayOneModule.createKlappayOne).mockReturnValue({ open: vi.fn() })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  function mount(attrs: Record<string, string> = {}): HTMLElement {
    const el = document.createElement(KLAPPAY_BUTTON_TAG)
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
    document.body.append(el)
    return el
  }

  it('registering twice does not throw', () => {
    expect(() => registerKlappayButton()).not.toThrow()
  })

  it('defaults to the black variant and md size', () => {
    const el = mount()
    const button = el.shadowRoot?.querySelector('button')

    expect(button?.getAttribute('data-variant')).toBe('black')
    expect(button?.getAttribute('data-size')).toBe('md')
  })

  it('reflects variant/size attributes onto the inner button', () => {
    const el = mount({ variant: 'yellow', size: 'lg' })
    const button = el.shadowRoot?.querySelector('button')

    expect(button?.getAttribute('data-variant')).toBe('yellow')
    expect(button?.getAttribute('data-size')).toBe('lg')
  })

  it('falls back to defaults for an unknown variant/size', () => {
    const el = mount({ variant: 'purple', size: 'huge' })
    const button = el.shadowRoot?.querySelector('button')

    expect(button?.getAttribute('data-variant')).toBe('black')
    expect(button?.getAttribute('data-size')).toBe('md')
  })

  it('updates the inner button when an attribute changes after mount', () => {
    const el = mount()
    el.setAttribute('variant', 'white')

    expect(el.shadowRoot?.querySelector('button')?.getAttribute('data-variant')).toBe('white')
  })

  it('accepts variant/size via property assignment, not just setAttribute', () => {
    const el = mount() as HTMLElement & { variant: string; size: string }
    el.variant = 'yellow'
    el.size = 'lg'

    const button = el.shadowRoot?.querySelector('button')
    expect(button?.getAttribute('data-variant')).toBe('yellow')
    expect(button?.getAttribute('data-size')).toBe('lg')
    expect(el.getAttribute('variant')).toBe('yellow')
    expect(el.getAttribute('size')).toBe('lg')
  })

  it('logs an error and does not open when charge-id is missing', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const el = mount({ origin: 'https://one.klappay.com' })

    el.shadowRoot?.querySelector('button')?.click()

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('charge-id'))
    expect(klappayOneModule.createKlappayOne).not.toHaveBeenCalled()
  })

  it('logs an error and does not open when no origin is configured', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const el = mount({ 'charge-id': 'ch_123' })

    el.shadowRoot?.querySelector('button')?.click()

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('origin'))
    expect(klappayOneModule.createKlappayOne).not.toHaveBeenCalled()
  })

  it('opens with the origin attribute when present', () => {
    const el = mount({ 'charge-id': 'ch_123', origin: 'https://one.klappay.com' })

    el.shadowRoot?.querySelector('button')?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledWith(
      expect.objectContaining({ chargeId: 'ch_123', origin: 'https://one.klappay.com' }),
    )
  })

  it('passes a valid mode attribute through to createKlappayOne', () => {
    const el = mount({ 'charge-id': 'ch_123', origin: 'https://one.klappay.com', mode: 'popup' })

    el.shadowRoot?.querySelector('button')?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'popup' }),
    )
  })

  it('ignores an invalid mode attribute', () => {
    const el = mount({ 'charge-id': 'ch_123', origin: 'https://one.klappay.com', mode: 'bogus' })

    el.shadowRoot?.querySelector('button')?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledWith(
      expect.objectContaining({ mode: undefined }),
    )
  })

  it('falls back to the globally configured origin when no attribute is set', () => {
    klappayOneModule.configure({ origin: 'https://one.klappay.com', locale: 'pt-BR' })
    const el = mount({ 'charge-id': 'ch_123' })

    el.shadowRoot?.querySelector('button')?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledWith(
      expect.objectContaining({ origin: 'https://one.klappay.com', locale: 'pt-BR' }),
    )
  })

  it('dispatches success/error/cancel DOM events from the underlying callbacks', () => {
    const el = mount({ 'charge-id': 'ch_123', origin: 'https://one.klappay.com' })
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const onCancel = vi.fn()
    el.addEventListener('success', onSuccess)
    el.addEventListener('error', onError)
    el.addEventListener('cancel', onCancel)

    el.shadowRoot?.querySelector('button')?.click()
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

  it('disables the button while a checkout is in flight and ignores a second click', () => {
    const el = mount({ 'charge-id': 'ch_123', origin: 'https://one.klappay.com' })
    const button = el.shadowRoot?.querySelector('button')

    button?.click()
    expect(button?.disabled).toBe(true)
    button?.click()

    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledTimes(1)
  })

  it('re-enables the button once the checkout settles, allowing a new one', () => {
    const el = mount({ 'charge-id': 'ch_123', origin: 'https://one.klappay.com' })
    const button = el.shadowRoot?.querySelector('button')

    button?.click()
    const passedConfig = vi.mocked(klappayOneModule.createKlappayOne).mock.calls[0]?.[0]
    passedConfig?.onCancel?.()

    expect(button?.disabled).toBe(false)
    button?.click()
    expect(klappayOneModule.createKlappayOne).toHaveBeenCalledTimes(2)
  })
})
