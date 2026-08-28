// @vitest-environment node
import { describe, expect, it } from 'vitest'

describe('package entry (SSR)', () => {
  it('importing the entry point does not throw when document is undefined', async () => {
    expect(typeof document).toBe('undefined')
    await expect(import('./index')).resolves.toBeDefined()
  })
})
