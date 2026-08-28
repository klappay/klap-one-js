import { observeNewElements, wireExisting } from './ui/auto-wire'
import { registerKlappayButton } from './ui/klappay-button'

export { configure, createKlappayOne } from './core/klappay-one'
export type { KlappayOne, KlappayOneConfig, KlappayOneError, PaymentResult } from './core/types'

registerKlappayButton()

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => wireExisting())
} else {
  wireExisting()
}

observeNewElements()
