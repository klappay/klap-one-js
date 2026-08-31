import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openIframe } from './iframe'

describe('openIframe', () => {
  beforeEach(() => {
    // jsdom doesn't implement scrollTo() — every close() calls it as part
    // of restoring scroll position, not just the test that asserts on it.
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  afterEach(() => {
    document.body.innerHTML = ''
    // Most tests below never call close(), so without this a test that
    // leaves body pinned would leak into whichever test runs next.
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    vi.restoreAllMocks()
  })

  function getFrame(): HTMLIFrameElement | null | undefined {
    const host = document.body.lastElementChild
    return host?.shadowRoot?.querySelector('iframe')
  }

  function getBackdrop(): HTMLElement | null | undefined {
    const host = document.body.lastElementChild
    return host?.shadowRoot?.querySelector('.backdrop')
  }

  function getStyleText(): string {
    const host = document.body.lastElementChild
    return host?.shadowRoot?.querySelector('style')?.textContent ?? ''
  }

  it("never clamps the frame's own height, so one-id's content can't end up taller than what it was told it has", () => {
    // A max-height here would clip the iframe box shorter than whatever
    // height resize() sets it to — but one-id measures its own content
    // against the height it's given, with no idea this box might get cut
    // shorter than that, and the excess would need to scroll inside the
    // iframe itself: a different, cross-origin document, unstyleable from
    // here. The backdrop scrolls instead, see the next test.
    openIframe('https://one.klappay.com/id/', vi.fn())

    expect(getStyleText()).not.toMatch(/\.frame\s*\{[^}]*max-height:/)
  })

  it('lets the backdrop itself scroll when a step is genuinely taller than the viewport', () => {
    openIframe('https://one.klappay.com/id/', vi.fn())

    expect(getStyleText()).toMatch(/\.backdrop\s*\{[^}]*overflow-y:\s*auto/)
  })

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

  it("pins body via position: fixed while open, so the page behind it can't scroll", () => {
    // overflow: hidden alone isn't enough — a wheel/trackpad gesture can
    // still move window.scrollY in some browsers even with it set on both
    // <html> and <body>. Pinning <body> with position: fixed removes it
    // from the scrollable area entirely, same as body-scroll-lock
    // libraries do.
    openIframe('https://one.klappay.com/id/', vi.fn())

    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.overflow).toBe('hidden')
  })

  it('offsets the pinned body by the current scroll position, so pinning it does not jump the page', () => {
    Object.defineProperty(window, 'scrollY', { value: 450, configurable: true })

    openIframe('https://one.klappay.com/id/', vi.fn())

    expect(document.body.style.top).toBe('-450px')
  })

  it("restores the page's own position/overflow and scroll offset once the modal is actually gone", () => {
    vi.useFakeTimers()
    document.body.style.position = 'relative'
    document.body.style.overflow = 'scroll'
    document.documentElement.style.overflow = 'auto'
    Object.defineProperty(window, 'scrollY', { value: 450, configurable: true })

    const handle = openIframe('https://one.klappay.com/id/', vi.fn())
    handle.close()
    // Not restored yet — the exit transition (or its fallback below) is
    // still "in flight", and the page shouldn't jump/reflow under it.
    expect(document.body.style.position).toBe('fixed')

    vi.advanceTimersByTime(300)
    expect(document.body.style.position).toBe('relative')
    expect(document.body.style.overflow).toBe('scroll')
    expect(document.documentElement.style.overflow).toBe('auto')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 450)
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
