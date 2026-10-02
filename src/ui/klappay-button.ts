import { createKlappayOne, getGlobalConfig } from '../core/klappay-one'
import type { KlappayButtonLabel, KlappayButtonSize, KlappayButtonVariant } from '../core/types'

export const KLAPPAY_BUTTON_TAG = 'klappay-button'

const VARIANTS: readonly KlappayButtonVariant[] = ['white', 'black']
const SIZES: readonly KlappayButtonSize[] = ['sm', 'md', 'lg']
const LABELS: readonly KlappayButtonLabel[] = ['full', 'short']
const DEFAULT_VARIANT: KlappayButtonVariant = 'black'
const DEFAULT_SIZE: KlappayButtonSize = 'md'
const DEFAULT_LABEL: KlappayButtonLabel = 'full'

const LABEL_TEXT: Record<KlappayButtonLabel, string> = {
  full: 'Pay with Klap One',
  short: 'Klap One',
}

const SIZE_STYLES: Record<
  KlappayButtonSize,
  { height: string; fontSize: string; padding: string; logoHeight: string }
> = {
  sm: { height: '32px', fontSize: '13px', padding: '0 14px', logoHeight: '14px' },
  md: { height: '40px', fontSize: '14px', padding: '0 18px', logoHeight: '16px' },
  lg: { height: '48px', fontSize: '16px', padding: '0 24px', logoHeight: '18px' },
}

// The kit's "small" cut of the Klap One symbol (16-24px), minified and
// cropped to its own bounding box so it centers optically against the
// label text. Each variant gets the cut the brand guidelines pair with that
// background: -on-dark on black, the light cut on white.
const LOGO_ON_DARK_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='16 47.2 224 161.6' fill-rule='evenodd'%3E%3Cpath fill='%233F3F46' d='M240 144.1L240 131.2L128 195.9L16 131.2L16 144.1L128 208.8Z'/%3E%3Cpath fill='%2352525B' d='M197.2 96.1L197.2 121.1L196.9 125.2L195.9 129.5L194.3 133.6L192.2 137.5L189.6 141.1L186.5 144.5L183 147.7L179.2 150.6L175.1 153.2L170.6 155.5L165.9 157.6L160.9 159.4L155.8 161L150.4 162.3L145 163.3L139.4 164L133.7 164.4L128 164.6L122.3 164.4L116.6 164L111 163.3L105.6 162.3L100.2 161L95 159.4L90.1 157.6L85.4 155.5L80.9 153.2L76.8 150.6L73 147.7L69.5 144.5L66.4 141.1L63.8 137.5L61.7 133.6L60.1 129.5L59.1 125.2L58.8 121.1L58.8 96.1L16 120.8L128 185.5L240 120.8Z'/%3E%3Cpath fill='%23A1A1AA' d='M67.8 120.8L68 123.8L68.7 126.8L69.9 129.8L71.4 132.7L73.5 135.5L75.9 138.2L78.7 140.7L81.9 143.1L85.4 145.4L89.3 147.4L93.5 149.3L97.9 150.9L102.6 152.3L107.4 153.5L112.4 154.4L117.5 155L122.8 155.4L128 155.6L133.2 155.4L138.4 155L143.6 154.4L148.6 153.5L153.4 152.3L158.1 150.9L162.5 149.3L166.7 147.4L170.6 145.4L174.1 143.1L177.3 140.7L180.1 138.2L182.6 135.5L184.6 132.7L186.1 129.8L187.3 126.8L188 123.8L188.2 120.8L188.2 103.9L186.5 105.7L183 108.9L179.2 111.8L175.1 114.4L170.6 116.7L165.9 118.8L160.9 120.6L155.8 122.2L150.4 123.5L145 124.5L139.4 125.2L133.7 125.6L128 125.8L122.3 125.6L116.6 125.2L111 124.5L105.6 123.5L100.2 122.2L95 120.6L90.1 118.8L85.4 116.7L80.9 114.4L76.8 111.8L73 108.9L69.5 105.7L67.8 103.9Z'/%3E%3Cpath fill='%23F4F4F5' d='M170.6 57.4L166.7 55.4L162.5 53.5L158.1 51.9L153.4 50.5L148.6 49.4L143.6 48.4L138.4 47.8L133.2 47.4L128 47.2L122.8 47.4L117.5 47.8L112.4 48.4L107.4 49.4L102.6 50.5L97.9 51.9L93.5 53.5L89.3 55.4L85.4 57.4L81.9 59.7L78.7 62.1L75.9 64.6L73.5 67.3L71.4 70.1L69.9 73L68.7 76L68 79L67.8 82L68 85L68.7 88L69.9 91L71.4 93.9L73.5 96.7L75.9 99.4L78.7 101.9L81.9 104.3L85.4 106.6L89.3 108.6L93.5 110.5L97.9 112.1L102.6 113.5L107.4 114.7L112.4 115.6L117.5 116.2L122.8 116.6L128 116.8L133.2 116.6L138.4 116.2L143.6 115.6L148.6 114.7L153.4 113.5L158.1 112.1L162.5 110.5L166.7 108.6L170.6 106.6L174.1 104.3L177.3 101.9L180.1 99.4L182.6 96.7L184.6 93.9L186.1 91L187.3 88L188 85L188.2 82L188 79L187.3 76L186.1 73L184.6 70.1L182.6 67.3L180.1 64.6L177.3 62.1L174.1 59.7Z'/%3E%3C/svg%3E"
const LOGO_ON_LIGHT_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='16 47.2 224 161.6' fill-rule='evenodd'%3E%3Cpath fill='%2371717A' d='M240 144.1L240 131.2L128 195.9L16 131.2L16 144.1L128 208.8Z'/%3E%3Cpath fill='%23A1A1AA' d='M197.2 96.1L197.2 121.1L196.9 125.2L195.9 129.5L194.3 133.6L192.2 137.5L189.6 141.1L186.5 144.5L183 147.7L179.2 150.6L175.1 153.2L170.6 155.5L165.9 157.6L160.9 159.4L155.8 161L150.4 162.3L145 163.3L139.4 164L133.7 164.4L128 164.6L122.3 164.4L116.6 164L111 163.3L105.6 162.3L100.2 161L95 159.4L90.1 157.6L85.4 155.5L80.9 153.2L76.8 150.6L73 147.7L69.5 144.5L66.4 141.1L63.8 137.5L61.7 133.6L60.1 129.5L59.1 125.2L58.8 121.1L58.8 96.1L16 120.8L128 185.5L240 120.8Z'/%3E%3Cpath fill='%2352525B' d='M67.8 120.8L68 123.8L68.7 126.8L69.9 129.8L71.4 132.7L73.5 135.5L75.9 138.2L78.7 140.7L81.9 143.1L85.4 145.4L89.3 147.4L93.5 149.3L97.9 150.9L102.6 152.3L107.4 153.5L112.4 154.4L117.5 155L122.8 155.4L128 155.6L133.2 155.4L138.4 155L143.6 154.4L148.6 153.5L153.4 152.3L158.1 150.9L162.5 149.3L166.7 147.4L170.6 145.4L174.1 143.1L177.3 140.7L180.1 138.2L182.6 135.5L184.6 132.7L186.1 129.8L187.3 126.8L188 123.8L188.2 120.8L188.2 103.9L186.5 105.7L183 108.9L179.2 111.8L175.1 114.4L170.6 116.7L165.9 118.8L160.9 120.6L155.8 122.2L150.4 123.5L145 124.5L139.4 125.2L133.7 125.6L128 125.8L122.3 125.6L116.6 125.2L111 124.5L105.6 123.5L100.2 122.2L95 120.6L90.1 118.8L85.4 116.7L80.9 114.4L76.8 111.8L73 108.9L69.5 105.7L67.8 103.9Z'/%3E%3Cpath fill='%2309090B' d='M170.6 57.4L166.7 55.4L162.5 53.5L158.1 51.9L153.4 50.5L148.6 49.4L143.6 48.4L138.4 47.8L133.2 47.4L128 47.2L122.8 47.4L117.5 47.8L112.4 48.4L107.4 49.4L102.6 50.5L97.9 51.9L93.5 53.5L89.3 55.4L85.4 57.4L81.9 59.7L78.7 62.1L75.9 64.6L73.5 67.3L71.4 70.1L69.9 73L68.7 76L68 79L67.8 82L68 85L68.7 88L69.9 91L71.4 93.9L73.5 96.7L75.9 99.4L78.7 101.9L81.9 104.3L85.4 106.6L89.3 108.6L93.5 110.5L97.9 112.1L102.6 113.5L107.4 114.7L112.4 115.6L117.5 116.2L122.8 116.6L128 116.8L133.2 116.6L138.4 116.2L143.6 115.6L148.6 114.7L153.4 113.5L158.1 112.1L162.5 110.5L166.7 108.6L170.6 106.6L174.1 104.3L177.3 101.9L180.1 99.4L182.6 96.7L184.6 93.9L186.1 91L187.3 88L188 85L188.2 82L188 79L187.3 76L186.1 73L184.6 70.1L182.6 67.3L180.1 64.6L177.3 62.1L174.1 59.7Z'/%3E%3C/svg%3E"

const VARIANT_LOGO_DATA_URI: Record<KlappayButtonVariant, string> = {
  black: LOGO_ON_DARK_DATA_URI,
  white: LOGO_ON_LIGHT_DATA_URI,
}

const VARIANT_STYLES: Record<
  KlappayButtonVariant,
  { background: string; color: string; border: string }
> = {
  white: { background: '#ffffff', color: '#09090b', border: '1px solid #d4d4d8' },
  black: { background: '#09090b', color: '#ffffff', border: 'none' },
}

function isVariant(value: string): value is KlappayButtonVariant {
  return (VARIANTS as string[]).includes(value)
}

function isSize(value: string): value is KlappayButtonSize {
  return (SIZES as string[]).includes(value)
}

function isLabel(value: string): value is KlappayButtonLabel {
  return (LABELS as string[]).includes(value)
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
    const { height, fontSize, padding, logoHeight } = SIZE_STYLES[size]
    return `
      button[data-size="${size}"] { height: var(--klappay-button-height, ${height}); font-size: ${fontSize}; padding: ${padding}; }
      button[data-size="${size}"] img { width: auto; height: ${logoHeight}; }
    `
  }).join('\n')

  return `
    :host { display: inline-block; max-width: 100%; }
    button {
      display: inline-flex;
      max-width: 100%;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: var(--klappay-radius, 8px);
      font-family: var(--klappay-font-family, Inter, system-ui, sans-serif);
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }
    button img { flex-shrink: 0; }
    button span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    button:hover { opacity: 0.9; }
    button:active { opacity: 0.8; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    ${variantRules}
    ${sizeRules}
  `
})()

export class KlappayButtonElement extends KlappayButtonBase {
  static get observedAttributes(): string[] {
    return ['variant', 'size', 'label', 'charge-id', 'origin']
  }

  #button: HTMLButtonElement
  #logo: HTMLImageElement
  #labelEl: HTMLSpanElement
  #busy = false

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = BUTTON_CSS
    this.#logo = document.createElement('img')
    this.#logo.alt = ''
    this.#logo.setAttribute('aria-hidden', 'true')

    this.#labelEl = document.createElement('span')

    this.#button = document.createElement('button')
    this.#button.type = 'button'
    this.#button.append(this.#logo, this.#labelEl)
    this.#button.addEventListener('click', () => this.#handleClick())

    shadow.append(style, this.#button)
    this.#applyVariant()
    this.#applySize()
    this.#applyLabel()
    this.#applyDisabled()
  }

  attributeChangedCallback(name: string): void {
    if (name === 'variant') this.#applyVariant()
    if (name === 'size') this.#applySize()
    if (name === 'label') this.#applyLabel()
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

  get label(): KlappayButtonLabel {
    const value = this.getAttribute('label') ?? ''
    return isLabel(value) ? value : DEFAULT_LABEL
  }

  set label(value: KlappayButtonLabel) {
    this.setAttribute('label', value)
  }

  #applyVariant(): void {
    this.#button.setAttribute('data-variant', this.variant)
    this.#logo.src = VARIANT_LOGO_DATA_URI[this.variant]
  }

  #applySize(): void {
    this.#button.setAttribute('data-size', this.size)
  }

  #applyLabel(): void {
    this.#labelEl.textContent = LABEL_TEXT[this.label]
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
