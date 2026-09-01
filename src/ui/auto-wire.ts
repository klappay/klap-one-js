import { createKlappayOne, getGlobalConfig } from '../core/klappay-one'

export const AUTO_WIRE_ATTRIBUTE = 'data-klappay-one'
export const AUTO_WIRE_ORIGIN_ATTRIBUTE = 'data-klappay-one-origin'
export const AUTO_WIRE_LOCALE_ATTRIBUTE = 'data-klappay-one-locale'
export const AUTO_WIRE_MODE_ATTRIBUTE = 'data-klappay-one-mode'
const WIRED_MARKER = 'data-klappay-one-wired'
// Marks an element mid-checkout — the wired element can be anything (a
// <button>, a <div>, an <a>), not just a form control, so this can't rely
// on the native `disabled` property the way ui/klappay-button.ts does.
const BUSY_MARKER = 'data-klappay-one-busy'

function wire(element: Element): void {
  if (element.hasAttribute(WIRED_MARKER)) return
  element.setAttribute(WIRED_MARKER, '')

  element.addEventListener('click', () => {
    // A second click before the first checkout settles would open a
    // second popup/iframe on top of the first.
    if (element.hasAttribute(BUSY_MARKER)) return

    const chargeId = element.getAttribute(AUTO_WIRE_ATTRIBUTE)
    if (!chargeId) return

    const origin = element.getAttribute(AUTO_WIRE_ORIGIN_ATTRIBUTE) ?? getGlobalConfig().origin
    if (!origin) {
      console.error(
        `[${AUTO_WIRE_ATTRIBUTE}] has no origin — set ${AUTO_WIRE_ORIGIN_ATTRIBUTE} or call KlappayOne.configure({ origin }).`,
      )
      return
    }

    const locale = element.getAttribute(AUTO_WIRE_LOCALE_ATTRIBUTE) ?? getGlobalConfig().locale
    const mode = element.getAttribute(AUTO_WIRE_MODE_ATTRIBUTE)

    element.setAttribute(BUSY_MARKER, '')
    const clearBusy = (): void => {
      element.removeAttribute(BUSY_MARKER)
    }

    createKlappayOne({
      chargeId,
      origin,
      locale,
      mode: mode === 'iframe' || mode === 'popup' ? mode : undefined,
      onPending: () => {
        element.dispatchEvent(new CustomEvent('pending'))
      },
      onConfirming: (data) => {
        element.dispatchEvent(new CustomEvent('confirming', { detail: data }))
      },
      onSuccess: (result) => {
        clearBusy()
        element.dispatchEvent(new CustomEvent('success', { detail: result }))
      },
      onError: (error) => {
        clearBusy()
        element.dispatchEvent(new CustomEvent('error', { detail: error }))
      },
      onCancel: (reason) => {
        clearBusy()
        element.dispatchEvent(new CustomEvent('cancel', { detail: { reason } }))
      },
    }).open()
  })
}

export function wireExisting(root: ParentNode = document): void {
  for (const element of root.querySelectorAll(`[${AUTO_WIRE_ATTRIBUTE}]`)) wire(element)
}

export function observeNewElements(root: Node = document.body): () => void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue
        if (node.hasAttribute(AUTO_WIRE_ATTRIBUTE)) wire(node)
        for (const element of node.querySelectorAll(`[${AUTO_WIRE_ATTRIBUTE}]`)) wire(element)
      }
    }
  })

  observer.observe(root, { childList: true, subtree: true })
  return () => observer.disconnect()
}
