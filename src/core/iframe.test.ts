import { afterEach, describe, expect, it, vi } from 'vitest'
import { type IframeHandle, openIframe } from './iframe'

describe('openIframe', () => {
  let handles: IframeHandle[] = []

  function open(url = 'https://one.klappay.com/id/'): IframeHandle {
    const handle = openIframe(url)
    handles.push(handle)
    return handle
  }

  afterEach(() => {
    // Every open() call registers a document-level wheel listener (see
    // iframe.ts) — closing here is what unregisters it. Left open, a
    // listener from one test would still fire (and potentially call
    // preventDefault) on a wheel event dispatched by a later, unrelated
    // test, since it's attached to `document` itself, not to anything
    // document.body.innerHTML below actually removes.
    vi.useFakeTimers()
    for (const handle of handles) handle.close()
    vi.advanceTimersByTime(400)
    vi.useRealTimers()
    handles = []
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

  function getStyleText(): string {
    const host = document.body.lastElementChild
    return host?.shadowRoot?.querySelector('style')?.textContent ?? ''
  }

  function mockBackdropScroll(scrollTop: number, clientHeight: number, scrollHeight: number): void {
    const backdrop = getBackdrop()
    if (!backdrop) throw new Error('backdrop not mounted')
    Object.defineProperty(backdrop, 'scrollTop', { value: scrollTop, configurable: true })
    Object.defineProperty(backdrop, 'clientHeight', { value: clientHeight, configurable: true })
    Object.defineProperty(backdrop, 'scrollHeight', { value: scrollHeight, configurable: true })
  }

  function dispatchWheel(deltaY: number): WheelEvent {
    const event = new WheelEvent('wheel', { deltaY, cancelable: true, bubbles: true })
    document.dispatchEvent(event)
    return event
  }

  it("never clamps the frame's own height, so one-id's content can't end up taller than what it was told it has", () => {
    // A max-height here would clip the iframe box shorter than whatever
    // height resize() sets it to — but one-id measures its own content
    // against the height it's given, with no idea this box might end up
    // cut shorter than that, and the excess would need to scroll inside
    // the iframe itself: a different, cross-origin document,
    // unstyleable from here. The backdrop scrolls instead, next test.
    open()

    expect(getStyleText()).not.toMatch(/\.frame\s*\{[^}]*max-height:/)
  })

  it('lets the backdrop itself scroll when a step is genuinely taller than the viewport', () => {
    open()

    expect(getStyleText()).toMatch(/\.backdrop\s*\{[^}]*overflow-y:\s*auto/)
  })

  it("floors the frame's height so a short step doesn't look cramped on a tall window, capped at 70vh so it never forces a short window into overflow just to hit that floor", () => {
    open()

    expect(getStyleText()).toMatch(/\.frame\s*\{[^}]*min-height:\s*min\(\d+px,\s*70vh\)/)
  })

  it('mounts an iframe pointing at the given URL inside a shadow root', () => {
    open('https://one.klappay.com/id/?chargeId=ch_123')

    expect(getFrame()?.src).toBe('https://one.klappay.com/id/?chargeId=ch_123')
  })

  it('allows storage-access so one-id can call requestStorageAccess()', () => {
    open()

    expect(getFrame()?.allow).toBe('storage-access')
  })

  it('updates the iframe height via resize()', () => {
    const handle = open()

    handle.resize(500)

    expect(getFrame()?.style.height).toBe('500px')
  })

  it('still becomes visible via the fallback timer if requestAnimationFrame never fires', () => {
    vi.useFakeTimers()
    // Simulates a backgrounded tab, where a real browser throttles rAF to
    // a stop — the modal would otherwise stay stuck at opacity: 0 forever.
    const originalRAF = window.requestAnimationFrame
    window.requestAnimationFrame = vi.fn()

    open()
    expect(getBackdrop()?.classList.contains('visible')).toBe(false)

    vi.advanceTimersByTime(320)
    expect(getBackdrop()?.classList.contains('visible')).toBe(true)

    window.requestAnimationFrame = originalRAF
    vi.useRealTimers()
  })

  it('removes the host element from the document via close(), after the exit transition', () => {
    vi.useFakeTimers()
    const handle = open()
    expect(document.body.lastElementChild?.shadowRoot).toBeTruthy()

    handle.close()
    // jsdom never fires a real `transitionend`, so this only proves close()
    // isn't synchronous anymore — the fallback timeout below is what
    // actually removes it, same as it would in a browser if the CSS
    // transition itself never completed for some reason.
    expect(getFrame()).toBeTruthy()

    vi.advanceTimersByTime(400)
    expect(getFrame()).toBeFalsy()
    vi.useRealTimers()
  })

  it('does not throw when close() is called more than once', () => {
    vi.useFakeTimers()
    const handle = open()

    handle.close()
    expect(() => handle.close()).not.toThrow()

    vi.advanceTimersByTime(400)
    expect(getFrame()).toBeFalsy()
    vi.useRealTimers()
  })

  it("cancels a wheel gesture that would scroll the page behind it, so the merchant's own page can't scroll while the modal is open", () => {
    // The backdrop has no scrollable content of its own here (a short step
    // like identify) — scrollTop/clientHeight/scrollHeight all agree there's
    // nowhere to go, so a gesture in either direction is already "at both
    // ends" and gets cancelled instead of chaining to the page behind.
    open()
    mockBackdropScroll(0, 400, 400)

    const event = dispatchWheel(50)

    expect(event.defaultPrevented).toBe(true)
  })

  it('lets the backdrop scroll its own content normally when it still has room, instead of blocking every wheel gesture outright', () => {
    // A step genuinely taller than the viewport (see the max-height test
    // above) — scrolled partway down, with more room below. Cancelling
    // here would also break the backdrop's own scrolling, not just stop
    // it from leaking to the page behind.
    open()
    mockBackdropScroll(100, 400, 900)

    const event = dispatchWheel(50)

    expect(event.defaultPrevented).toBe(false)
  })

  it('cancels a downward wheel gesture once the backdrop is already scrolled to its own bottom', () => {
    open()
    mockBackdropScroll(500, 400, 900)

    const event = dispatchWheel(50)

    expect(event.defaultPrevented).toBe(true)
  })

  it('cancels an upward wheel gesture once the backdrop is already scrolled to its own top', () => {
    open()
    mockBackdropScroll(0, 400, 900)

    const event = dispatchWheel(-50)

    expect(event.defaultPrevented).toBe(true)
  })

  it("doesn't touch the merchant page's own <body>/<html> styles at all", () => {
    // Regression guard for the earlier position: fixed approach — this
    // package never has a reason to write to the host page's own body,
    // only to its own Shadow DOM.
    const bodyStyleBefore = document.body.getAttribute('style')
    const htmlStyleBefore = document.documentElement.getAttribute('style')

    open()

    expect(document.body.getAttribute('style')).toBe(bodyStyleBefore)
    expect(document.documentElement.getAttribute('style')).toBe(htmlStyleBefore)
  })

  it('stops intercepting wheel gestures once the modal is closed', () => {
    vi.useFakeTimers()
    const handle = open()
    mockBackdropScroll(0, 400, 400)

    handle.close()
    vi.advanceTimersByTime(400)

    const event = dispatchWheel(50)
    expect(event.defaultPrevented).toBe(false)
    vi.useRealTimers()
  })

  it('ignores a click on the backdrop — there is no way to dismiss the modal from outside the iframe', () => {
    open()

    getBackdrop()?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(getFrame()).toBeTruthy()
    expect(document.body.lastElementChild?.shadowRoot).toBeTruthy()
  })
})
