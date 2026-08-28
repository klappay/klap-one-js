import { afterEach, describe, expect, it, vi } from 'vitest'
import { isPopupClosed, openPopup } from './popup'

describe('openPopup', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens the given URL in a named, centered popup window', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    vi.spyOn(window, 'screenX', 'get').mockReturnValue(100)
    vi.spyOn(window, 'screenY', 'get').mockReturnValue(50)
    vi.spyOn(window, 'outerWidth', 'get').mockReturnValue(1200)
    vi.spyOn(window, 'outerHeight', 'get').mockReturnValue(900)

    openPopup('https://one.klappay.com/id/?chargeId=ch_123')

    expect(window.open).toHaveBeenCalledWith(
      'https://one.klappay.com/id/?chargeId=ch_123',
      'klappay-one',
      'width=420,height=720,left=490,top=140',
    )
  })

  it('returns whatever window.open returns', () => {
    const fakePopup = { closed: false } as Window
    vi.spyOn(window, 'open').mockReturnValue(fakePopup)

    expect(openPopup('https://one.klappay.com/id/')).toBe(fakePopup)
  })
})

describe('isPopupClosed', () => {
  it('treats a null popup (blocked) as closed', () => {
    expect(isPopupClosed(null)).toBe(true)
  })

  it('reflects the popup window.closed flag', () => {
    expect(isPopupClosed({ closed: true } as Window)).toBe(true)
    expect(isPopupClosed({ closed: false } as Window)).toBe(false)
  })
})
