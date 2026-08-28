import { describe, expect, it } from 'vitest'
import { isMobileUserAgent } from './device'

describe('isMobileUserAgent', () => {
  it('detects common mobile user agents', () => {
    expect(isMobileUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true)
    expect(isMobileUserAgent('Mozilla/5.0 (Linux; Android 14)')).toBe(true)
    expect(isMobileUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe(true)
  })

  it('does not flag common desktop user agents', () => {
    expect(isMobileUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(false)
    expect(isMobileUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false)
  })
})
