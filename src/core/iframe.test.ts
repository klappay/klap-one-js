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

  it('removes the host element from the document via close()', () => {
    const handle = openIframe('https://one.klappay.com/id/', vi.fn())
    expect(document.body.lastElementChild?.shadowRoot).toBeTruthy()

    handle.close()

    expect(getFrame()).toBeFalsy()
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
