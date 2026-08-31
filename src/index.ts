import { observeNewElements, wireExisting } from './ui/auto-wire'
import { registerKlappayButton } from './ui/klappay-button'

export { configure, createKlappayOne } from './core/klappay-one'
export type { KlappayOne, KlappayOneConfig, KlappayOneError, PaymentResult } from './core/types'

registerKlappayButton()

// Node (SSR/static generation) has no `document` — registerKlappayButton()
// guards itself against a missing customElements, but wireExisting()/
// observeNewElements() default to reading `document`/`document.body` as
// soon as they're called, so both calls have to wait for the same
// readiness this repo's own docs recommend (a plain <script> tag, which
// runs synchronously while <head> is still being parsed — document.body
// doesn't exist yet at that point, so observeNewElements() would crash
// trying to observe(null) if it ran outside this gate, same as
// wireExisting() would if it read document.body itself).
if (typeof document !== 'undefined') {
  function init(): void {
    wireExisting()
    observeNewElements()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
}
