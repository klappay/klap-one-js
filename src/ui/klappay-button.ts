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
// ../../logo-black-white.svg — the first two via `sips -Z 40`, the third
// (a two-layer composite: a black hand shape plus white "clap" strokes on
// top) rendered onto a 40x40 canvas in a browser instead, since sips can't
// flatten multiple layered <image>s the way a real renderer does. The
// source SVGs just wrap a raster, far too heavy to inline at full res for
// an icon rendered at 14-18px. Regenerate from those files if they change.
//
// logo-white has no black ink in it, so it stays legible on the black
// variant's dark background; logo-black's black "clap" strokes need a
// light background to read, so it's used on the white variant. Yellow
// gets its own black-hand-with-white-strokes icon instead — it reads
// better against the yellow/orange background than either single-tone
// icon does.
const LOGO_NO_BLACK_INK_DATA_URI =
  'data:image/png;base64,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'
const LOGO_BLACK_INK_DATA_URI =
  'data:image/png;base64,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'

const LOGO_BLACK_WHITE_DATA_URI =
  'data:image/png;base64,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'

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
    style.textContent = KlappayButtonElement.#css()
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
      onSuccess: (result) => {
        reenable()
        this.dispatchEvent(new CustomEvent('success', { detail: result }))
      },
      onError: (error) => {
        reenable()
        this.dispatchEvent(new CustomEvent('error', { detail: error }))
      },
      onCancel: () => {
        reenable()
        this.dispatchEvent(new CustomEvent('cancel'))
      },
    }).open()
  }

  static #css(): string {
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
  }
}

export function registerKlappayButton(): void {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(KLAPPAY_BUTTON_TAG)) {
    customElements.define(KLAPPAY_BUTTON_TAG, KlappayButtonElement)
  }
}
