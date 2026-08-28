import { observeNewElements, wireExisting } from './ui/auto-wire'
import { registerKlappayButton } from './ui/klappay-button'

export { configure, createKlappayOne } from './core/klappay-one'
export type { KlappayOne, KlappayOneConfig, KlappayOneError, PaymentResult } from './core/types'

registerKlappayButton()

// Node (SSR/static generation) has no `document` — registerKlappayButton()
// guards itself against a missing customElements, but wireExisting()/
// observeNewElements() default to reading `document` as soon as they're
// called, so the call itself has to be skipped there, not just its args.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => wireExisting())
  } else {
    wireExisting()
  }

  observeNewElements()
}
