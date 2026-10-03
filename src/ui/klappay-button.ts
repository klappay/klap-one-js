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
  full: 'Pay with Klap',
  short: 'Klap',
}

const SIZE_STYLES: Record<
  KlappayButtonSize,
  { height: string; fontSize: string; padding: string; logoHeight: string }
> = {
  sm: { height: '32px', fontSize: '13px', padding: '0 14px', logoHeight: '16px' },
  md: { height: '40px', fontSize: '14px', padding: '0 18px', logoHeight: '18px' },
  lg: { height: '48px', fontSize: '16px', padding: '0 24px', logoHeight: '20px' },
}

// The flat Klap "K" from klap-site, cropped to its own bounding box so it
// centers optically against the label text: brand color on the black
// variant, ink on the white one.
const LOGO_ON_DARK_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='63.77 16 128.46 224'%3E%3Cpath fill='%23D9D4CB' d='M91.32 57.61L92.61 56.86L109.82 66.8L103.24 70.61Z M63.77 73.51L91.32 57.61L103.24 70.61L63.77 93.39Z M66.26 226.3L63.77 224.86L63.77 109.96L80.99 129.84L80.99 192.93Z M63.77 109.96L63.77 93.39L80.99 83.45L80.99 129.84Z M80.99 234.8L70.84 228.94L80.99 217.22Z M70.84 228.94L66.26 226.3L80.99 192.93L80.99 217.22Z M114.91 63.87L126.69 37.19L157.64 19.32L145.86 46Z M157.64 19.32L163.39 16L180.6 25.94L150.17 43.51L145.86 46Z M127.82 56.41L145.86 46L127.82 86.85Z M89.99 88.65L118.82 72L118.82 223.35L89.99 240Z M118.82 129.51L152.9 52.32L189.6 31.14L145.04 129.51L118.82 159.78Z M145.04 129.51L192.23 180.97L155.53 202.16L118.82 159.78Z'/%3E%3C/svg%3E"
const LOGO_ON_LIGHT_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='63.77 16 128.46 224'%3E%3Cpath fill='%2309090B' d='M91.32 57.61L92.61 56.86L109.82 66.8L103.24 70.61Z M63.77 73.51L91.32 57.61L103.24 70.61L63.77 93.39Z M66.26 226.3L63.77 224.86L63.77 109.96L80.99 129.84L80.99 192.93Z M63.77 109.96L63.77 93.39L80.99 83.45L80.99 129.84Z M80.99 234.8L70.84 228.94L80.99 217.22Z M70.84 228.94L66.26 226.3L80.99 192.93L80.99 217.22Z M114.91 63.87L126.69 37.19L157.64 19.32L145.86 46Z M157.64 19.32L163.39 16L180.6 25.94L150.17 43.51L145.86 46Z M127.82 56.41L145.86 46L127.82 86.85Z M89.99 88.65L118.82 72L118.82 223.35L89.99 240Z M118.82 129.51L152.9 52.32L189.6 31.14L145.04 129.51L118.82 159.78Z M145.04 129.51L192.23 180.97L155.53 202.16L118.82 159.78Z'/%3E%3C/svg%3E"

const VARIANT_LOGO_DATA_URI: Record<KlappayButtonVariant, string> = {
  black: LOGO_ON_DARK_DATA_URI,
  white: LOGO_ON_LIGHT_DATA_URI,
}

const VARIANT_STYLES: Record<
  KlappayButtonVariant,
  { background: string; color: string; border: string }
> = {
  white: { background: '#ffffff', color: '#09090b', border: '1px solid #d4d4d8' },
  black: { background: '#09090b', color: '#d9d4cb', border: 'none' },
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
