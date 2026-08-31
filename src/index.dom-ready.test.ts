import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('package entry — DOM readiness', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true })
  })

  it('defers wiring up new elements until DOMContentLoaded, like it already does for existing ones', async () => {
    // Regression: observeNewElements() used to be called unconditionally
    // regardless of readyState, unlike wireExisting(). jsdom's document.body
    // always exists (it doesn't incrementally parse HTML like a real
    // browser does), so this test can't reproduce the actual crash that
    // caused in the field — a plain <script> tag (the documented
    // no-bundler path) runs synchronously while a real browser's <head> is
    // still being parsed, before document.body exists, and
    // observer.observe(null, ...) throws. What this test can and does
    // verify is the fix itself: both calls now wait for the same
    // readiness.
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true })
    const observeSpy = vi.spyOn(MutationObserver.prototype, 'observe')

    await expect(import('./index')).resolves.toBeDefined()
    expect(observeSpy).not.toHaveBeenCalled()

    document.dispatchEvent(new Event('DOMContentLoaded'))
    expect(observeSpy).toHaveBeenCalledWith(document.body, expect.anything())
  })
})
