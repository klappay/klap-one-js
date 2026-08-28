const POPUP_WIDTH = 420
const POPUP_HEIGHT = 720
const POPUP_NAME = 'klappay-one'

export function openPopup(url: string): Window | null {
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2

  return window.open(
    url,
    POPUP_NAME,
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`,
  )
}

export function isPopupClosed(popup: Window | null): boolean {
  return popup === null || popup.closed
}
