import { afterEach, describe, expect, it, vi } from 'vitest'
import { openIframe } from './iframe'

describe('openIframe', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function getFrame(): HTMLIFrameElement | null | undefined {
    const host = document.body.lastElementChild
    return host?.shadowRoot?.querySelector('iframe')
  }

  function getBackdrop(): HTMLElement | null | undefined {
    const host = document.body.lastElementChild
    return host?.shadowRoot?.querySelector('.backdrop')
  }

  it('mounts an iframe pointing at the given URL inside a shadow root', () => {
    openIframe('https://one.klappay.com/id/?chargeId=ch_123', vi.fn())

    expect(getFrame()?.src).toBe('https://one.klappay.com/id/?chargeId=ch_123')
  })

  it('updates the iframe height via resize()', () => {
    const handle = openIframe('https://one.klappay.com/id/', vi.fn())

    handle.resize(500)

    expect(getFrame()?.style.height).toBe('500px')
  })

  it('still becomes visible via the fallback timer if requestAnimationFrame never fires', () => {
    vi.useFakeTimers()
    // Simulates a backgrounded tab, where a real browser throttles rAF to
    // a stop — the modal would otherwise stay stuck at opacity: 0 forever.
    const originalRAF = window.requestAnimationFrame
    window.requestAnimationFrame = vi.fn()

    openIframe('https://one.klappay.com/id/', vi.fn())
    expect(getBackdrop()?.classList.contains('visible')).toBe(false)

    vi.advanceTimersByTime(200)
    expect(getBackdrop()?.classList.contains('visible')).toBe(true)

    window.requestAnimationFrame = originalRAF
    vi.useRealTimers()
  })

  it('removes the host element from the document via close(), after the exit transition', () => {
    vi.useFakeTimers()
    const handle = openIframe('https://one.klappay.com/id/', vi.fn())
    expect(document.body.lastElementChild?.shadowRoot).toBeTruthy()

    handle.close()
    // jsdom never fires a real `transitionend`, so this only proves close()
    // isn't synchronous anymore — the fallback timeout below is what
    // actually removes it, same as it would in a browser if the CSS
    // transition itself never completed for some reason.
    expect(getFrame()).toBeTruthy()

    vi.advanceTimersByTime(300)
    expect(getFrame()).toBeFalsy()
    vi.useRealTimers()
  })

  it('does not throw when close() is called more than once', () => {
    vi.useFakeTimers()
    const handle = openIframe('https://one.klappay.com/id/', vi.fn())

    handle.close()
    expect(() => handle.close()).not.toThrow()

    vi.advanceTimersByTime(300)
    expect(getFrame()).toBeFalsy()
    vi.useRealTimers()
  })

  it('calls onDismiss when the backdrop itself is clicked', () => {
    const onDismiss = vi.fn()
    openIframe('https://one.klappay.com/id/', onDismiss)

    getBackdrop()?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not call onDismiss when the iframe itself is clicked', () => {
    const onDismiss = vi.fn()
    openIframe('https://one.klappay.com/id/', onDismiss)

    getFrame()?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onDismiss).not.toHaveBeenCalled()
  })
})
