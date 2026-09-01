import { createKlappayOne, getGlobalConfig } from '../core/klappay-one'
import type { KlappayButtonSize, KlappayButtonVariant } from '../core/types'

export const KLAPPAY_BUTTON_TAG = 'klappay-button'

const VARIANTS: readonly KlappayButtonVariant[] = ['white', 'yellow', 'black']
const SIZES: readonly KlappayButtonSize[] = ['sm', 'md', 'lg']
const DEFAULT_VARIANT: KlappayButtonVariant = 'black'
const DEFAULT_SIZE: KlappayButtonSize = 'md'

const SIZE_STYLES: Record<
  KlappayButtonSize,
  { height: string; fontSize: string; padding: string; logoSize: string }
> = {
  sm: { height: '32px', fontSize: '13px', padding: '0 14px', logoSize: '14px' },
  md: { height: '40px', fontSize: '14px', padding: '0 18px', logoSize: '16px' },
  lg: { height: '48px', fontSize: '16px', padding: '0 24px', logoSize: '18px' },
}

// 40x40 downscales of ../../logo-white.svg, ../../logo-black.svg, and
// ../../logo-black-white.svg, each rendered onto a 40x40 square canvas
// respecting the source SVG's own (square) viewBox and layer positioning
// — never by resizing the embedded raster in isolation, which is smaller
// than the viewBox and off-center, and produces a non-square image that
// then gets visibly stretched by the CSS below (width/height are equal).
// The source SVGs just wrap a raster, far too heavy to inline at full res
// for an icon rendered at 14-18px. Regenerate from those files if they
// change.
//
// Encoded as lossless WebP, not PNG — ~37% smaller for the exact same
// pixels at this size (verified: the only bytes that differ from the PNG
// source are the RGB channels under fully transparent pixels, which never
// render). Every browser this button ships to decodes WebP natively.
//
// logo-white has no black ink in it, so it stays legible on the black
// variant's dark background; logo-black's black "clap" strokes need a
// light background to read, so it's used on the white variant. Yellow
// gets its own black-hand-with-white-strokes icon instead — it reads
// better against the yellow/orange background than either single-tone
// icon does.
const LOGO_NO_BLACK_INK_DATA_URI =
  'data:image/webp;base64,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'
const LOGO_BLACK_INK_DATA_URI =
  'data:image/webp;base64,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'

const LOGO_BLACK_WHITE_DATA_URI =
  'data:image/webp;base64,UklGRmwFAABXRUJQVlA4TGAFAAAvJ8AJEDXRjbZ/ld2ImZmZmZnhMjMzMzMcMzO3oCZ/wR4wx7/oKjO2wf6bamCMaJ3hFiEqwnA0J1YFvrljj0OHLuBmvw48ys6MI5egMgxNbPybcagKVtSBIvXgSKFLuNm/hQ23EAcEghDxfzMG0rYJ9y952yVBkm3aVti2bdu2jZGNmW2/923bto1n27Z58O7GBODD6B4wxcKSB5sCM5bCn0RwLHl5SCmwI+KjZj0C0SQG8SYFawVOrIEnSTxiqMlHW4HbSB7cBdjk4tuAkAJrLD4jAP3AO+iuQ9Z89ON07MuQzyR2GLAveBvLJ0vhiMZiOqS9go0GFI0EYT8VeiRwN/dORpA6BNQTPAhcS56rI5xzYwErWUzi3kBwH7A/SwqCRUiuYakXmMYCL8fcyDbSB4BpOKiQkhp0l/Z2iWZCfF8JVzDfbDuVlyv++/3BbSS6Yjhjs8jkzz1wG4nDZgoM4onQBXjcRdxIUG+w8GNEQfImfAaB5HL2rtConaxfB08xxtOhWC6EvhHzMtRK8alFzdTlquXCUJAU69m8FKMQemweBsql5lb4d/kV2xPBl1ZsKpDaxJzFnnw+taC2hYkxgJ3M3giXjtMKvK5fIhj0sMefboXgKQDBw4HVBJaRcYBHgqrwT6LyAFlLIBX0g/juEVMBtyGtIwXjXTyIJuSf69CdBkOQL4VnZVwcDCaxmcVL0ZnDIVvhW0cmn17nJyu4kE5WF7+exY97YNMCuDawY48HJnP6dC2pEwHMIw5FUbOcLUFWvH2O4t/r/HoqtXOgPGsgcvGaDdkbLBZBXYuhqQVwbPVbtjyRwvEmJEL520k8BdjAraeIR4HaODYKSLyCg99ncFRBwpb/rODRoGYK9sGC2gDTBzMBQn4aQc2lGOxlzSK5kAM/+gXxTI5GA4h8CTwtISucq53siab3KoRcCpymBt4KRwrnv2Y+nsfJbCIfYRLzISxSf7KQxi0sWXIe9CW41aBUzOVqKhUEtfBwer22ibriqb3czltMxERMTEQfFhA+F+pAE0lXobyOWevrWiJ0mDnIhjApSU4CZlO3gzFBesVSiFROJ9Nah9Zuxmw5H7oNFx14QUH8V4vE35nWJHWRHU/b/5uY9smuUs6d14M7YC3FfQJAENtMxETswMRd2ZRMgiEGgdN4d9jUhWYV6eMBvcFkWG5jLYz/g0Fnr0beRIN3U1LAi042xF83E+3H5E9o9Fwtd0MYDuCrxxDJbJ7XoZUHmwPADLADnIAQwKtRxb3jkTQtZ1kYolXsX4skIiLABvgAH4FJYBHoBlgR8cLh6xDPwiuRpi1QJZStZEeqsBaPASmYOwBywDSwC2wCn4A0L+I+WNLRyeb3QojZ0JtYy6K1Il7F8s1S0XuggTgHgAWQBmQAvj+8iHgnQn7seKSUlu1jItb3ehHHHNDr9ToREa9EZC+7PklELJmMLoYqxUjF0enu9naUoJRP0QbGpkF2SiajPAZYSawCt5YbEARKgKYf0DxSjEgYRpFUfeaRxESsxZ5U7uxHzR8BB+AnsAd0AJLoeL4evfC5s5gtwaT3QAwPr4HP1AL8gNVXgfOAqFvl3LECitO321VcnQhhExE7yDHBKCY7FO5zqA0YAHcAI4Db7VRB81g4oQlMJjKwtS5s5/diyBO2ENY40B7+hOKcBZ+JOruf6XYi4kUgElD2IpqnM1AM4d5S1vxYruZbA2+S+R9E6y7+RHKjHLdGxDrwXvS+9jNQ6UZENPf/Fkfl2cUc+rFQg7MCv+s/vFefAZoAEtBQQXS6LwLiR914bwP2wBZwD2BDnU6894H8d/716rkvATUg/Kjz/nGfAw=='

const VARIANT_LOGO_DATA_URI: Record<KlappayButtonVariant, string> = {
  black: LOGO_NO_BLACK_INK_DATA_URI,
  yellow: LOGO_BLACK_WHITE_DATA_URI,
  white: LOGO_BLACK_INK_DATA_URI,
}

const VARIANT_STYLES: Record<
  KlappayButtonVariant,
  { background: string; color: string; border: string }
> = {
  white: { background: '#ffffff', color: '#111111', border: '1px solid #e5e5e5' },
  yellow: { background: '#f2b90c', color: '#111111', border: 'none' },
  black: { background: '#111111', color: '#ffffff', border: 'none' },
}

function isVariant(value: string): value is KlappayButtonVariant {
  return (VARIANTS as string[]).includes(value)
}

function isSize(value: string): value is KlappayButtonSize {
  return (SIZES as string[]).includes(value)
}

// Node (SSR/static generation) has no HTMLElement — falling back to a
// plain class keeps this module importable there. The fallback is never
// instantiated outside a browser: registerKlappayButton() below skips
// customElements.define() when customElements itself doesn't exist.
const KlappayButtonBase: typeof HTMLElement =
  typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as unknown as typeof HTMLElement)

// Built once at module load, not per instance — every instance's CSS is
// identical (VARIANTS/SIZES/VARIANT_STYLES/SIZE_STYLES never change at
// runtime), so a page with several <klappay-button>s was re-running these
// map()/join() calls once per button for no reason.
const BUTTON_CSS = (() => {
  const variantRules = VARIANTS.map((variant) => {
    const { background, color, border } = VARIANT_STYLES[variant]
    return `button[data-variant="${variant}"] { background: var(--klappay-background, ${background}); color: var(--klappay-color, ${color}); border: ${border}; }`
  }).join('\n')

  const sizeRules = SIZES.map((size) => {
    const { height, fontSize, padding, logoSize } = SIZE_STYLES[size]
    return `
      button[data-size="${size}"] { height: var(--klappay-button-height, ${height}); font-size: ${fontSize}; padding: ${padding}; }
      button[data-size="${size}"] img { width: ${logoSize}; height: ${logoSize}; }
    `
  }).join('\n')

  return `
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: var(--klappay-radius, 8px);
      font-family: var(--klappay-font-family, system-ui, sans-serif);
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }
    button img { flex-shrink: 0; }
    button:hover { opacity: 0.9; }
    button:active { opacity: 0.8; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    ${variantRules}
    ${sizeRules}
  `
})()

export class KlappayButtonElement extends KlappayButtonBase {
  static get observedAttributes(): string[] {
    return ['variant', 'size', 'charge-id', 'origin']
  }

  #button: HTMLButtonElement
  #logo: HTMLImageElement
  #busy = false

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = BUTTON_CSS
    this.#logo = document.createElement('img')
    this.#logo.alt = ''
    this.#logo.setAttribute('aria-hidden', 'true')

    const label = document.createElement('span')
    label.textContent = 'Pay with Klappay'

    this.#button = document.createElement('button')
    this.#button.type = 'button'
    this.#button.append(this.#logo, label)
    this.#button.addEventListener('click', () => this.#handleClick())

    shadow.append(style, this.#button)
    this.#applyVariant()
    this.#applySize()
    this.#applyDisabled()
  }

  attributeChangedCallback(name: string): void {
    if (name === 'variant') this.#applyVariant()
    if (name === 'size') this.#applySize()
    if (name === 'charge-id' || name === 'origin') this.#applyDisabled()
  }

  get variant(): KlappayButtonVariant {
    const value = this.getAttribute('variant') ?? ''
    return isVariant(value) ? value : DEFAULT_VARIANT
  }

  set variant(value: KlappayButtonVariant) {
    this.setAttribute('variant', value)
  }

  get size(): KlappayButtonSize {
    const value = this.getAttribute('size') ?? ''
    return isSize(value) ? value : DEFAULT_SIZE
  }

  set size(value: KlappayButtonSize) {
    this.setAttribute('size', value)
  }

  #applyVariant(): void {
    this.#button.setAttribute('data-variant', this.variant)
    this.#logo.src = VARIANT_LOGO_DATA_URI[this.variant]
  }

  #applySize(): void {
    this.#button.setAttribute('data-size', this.size)
  }

  // Only checks the origin *attribute*, not a `configure()` call made after
  // this element was already upgraded — there's no subscription mechanism
  // for global config changes. Set `origin` before this element is parsed,
  // or as its own attribute, if the disabled state needs to react live.
  #hasRequiredConfig(): boolean {
    const chargeId = this.getAttribute('charge-id')
    const origin = this.getAttribute('origin') ?? getGlobalConfig().origin
    return Boolean(chargeId && origin)
  }

  #applyDisabled(): void {
    this.#button.disabled = this.#busy || !this.#hasRequiredConfig()
  }

  #handleClick(): void {
    // A second click before the first checkout settles would open a
    // second popup/iframe on top of the first — disabled for the
    // duration, re-enabled by whichever outcome fires first. The button is
    // also natively disabled whenever charge-id/origin are missing
    // (#applyDisabled), so a click never reaches here in that case — these
    // checks are a defensive fallback, not the primary guard.
    if (this.#button.disabled) return

    const chargeId = this.getAttribute('charge-id')
    if (!chargeId) {
      console.error('<klappay-button> is missing a required charge-id attribute.')
      return
    }

    const origin = this.getAttribute('origin') ?? getGlobalConfig().origin
    if (!origin) {
      console.error(
        '<klappay-button> has no origin — set the origin attribute or call KlappayOne.configure({ origin }).',
      )
      return
    }

    const locale = this.getAttribute('locale') ?? getGlobalConfig().locale
    const mode = this.getAttribute('mode')

    this.#busy = true
    this.#applyDisabled()
    const reenable = (): void => {
      this.#busy = false
      this.#applyDisabled()
    }

    createKlappayOne({
      chargeId,
      origin,
      locale,
      mode: mode === 'iframe' || mode === 'popup' ? mode : undefined,
      // Not a terminal outcome — the button stays busy/disabled exactly as
      // it already is, this only forwards the signal for a page that wants
      // to persist state before the wallet responds.
      onPending: () => {
        this.dispatchEvent(new CustomEvent('pending'))
      },
      onConfirming: (data) => {
        this.dispatchEvent(new CustomEvent('confirming', { detail: data }))
      },
      onSuccess: (result) => {
        reenable()
        this.dispatchEvent(new CustomEvent('success', { detail: result }))
      },
      onError: (error) => {
        reenable()
        this.dispatchEvent(new CustomEvent('error', { detail: error }))
      },
      onCancel: (reason) => {
        reenable()
        this.dispatchEvent(new CustomEvent('cancel', { detail: { reason } }))
      },
    }).open()
  }
}

export function registerKlappayButton(): void {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(KLAPPAY_BUTTON_TAG)) {
    customElements.define(KLAPPAY_BUTTON_TAG, KlappayButtonElement)
  }
}
