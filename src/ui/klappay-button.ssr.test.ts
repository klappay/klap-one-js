// @vitest-environment node
import { describe, expect, it } from 'vitest'

describe('klappay-button (SSR)', () => {
  it('importing the module does not throw when HTMLElement/customElements are undefined', async () => {
    expect(typeof HTMLElement).toBe('undefined')
    await expect(import('./klappay-button')).resolves.toBeDefined()
  })

  it('registerKlappayButton() is a no-op instead of throwing', async () => {
    const { registerKlappayButton } = await import('./klappay-button')
    expect(typeof customElements).toBe('undefined')
    expect(() => registerKlappayButton()).not.toThrow()
  })
})
