import { createKlappayOne, getGlobalConfig } from '../core/klappay-one'
import type { KlappayButtonSize, KlappayButtonVariant } from '../core/types'

export const KLAPPAY_BUTTON_TAG = 'klappay-button'

const VARIANTS: readonly KlappayButtonVariant[] = ['white', 'yellow', 'black']
const SIZES: readonly KlappayButtonSize[] = ['sm', 'md', 'lg']
const DEFAULT_VARIANT: KlappayButtonVariant = 'black'
const DEFAULT_SIZE: KlappayButtonSize = 'md'

const SIZE_STYLES: Record<
  KlappayButtonSize,
  { height: string; fontSize: string; padding: string }
> = {
  sm: { height: '32px', fontSize: '13px', padding: '0 14px' },
  md: { height: '40px', fontSize: '14px', padding: '0 18px' },
  lg: { height: '48px', fontSize: '16px', padding: '0 24px' },
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

export class KlappayButtonElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['variant', 'size']
  }

  #button: HTMLButtonElement

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = KlappayButtonElement.#css()
    this.#button = document.createElement('button')
    this.#button.type = 'button'
    this.#button.textContent = 'Pay with Klappay'
    this.#button.addEventListener('click', () => this.#handleClick())

    shadow.append(style, this.#button)
    this.#applyVariant()
    this.#applySize()
  }

  attributeChangedCallback(name: string): void {
    if (name === 'variant') this.#applyVariant()
    if (name === 'size') this.#applySize()
  }

  get variant(): KlappayButtonVariant {
    const value = this.getAttribute('variant') ?? ''
    return isVariant(value) ? value : DEFAULT_VARIANT
  }

  get size(): KlappayButtonSize {
    const value = this.getAttribute('size') ?? ''
    return isSize(value) ? value : DEFAULT_SIZE
  }

  #applyVariant(): void {
    this.#button.setAttribute('data-variant', this.variant)
  }

  #applySize(): void {
    this.#button.setAttribute('data-size', this.size)
  }

  #handleClick(): void {
    // A second click before the first checkout settles would open a
    // second popup/iframe on top of the first — disabled for the
    // duration, re-enabled by whichever outcome fires first.
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

    this.#button.disabled = true
    const reenable = (): void => {
      this.#button.disabled = false
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
      const { height, fontSize, padding } = SIZE_STYLES[size]
      return `button[data-size="${size}"] { height: var(--klappay-button-height, ${height}); font-size: ${fontSize}; padding: ${padding}; }`
    }).join('\n')

    return `
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--klappay-radius, 8px);
        font-family: var(--klappay-font-family, system-ui, sans-serif);
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.15s ease;
      }
      button:hover { opacity: 0.9; }
      button:active { opacity: 0.8; }
      button:disabled { opacity: 0.6; cursor: not-allowed; }
      ${variantRules}
      ${sizeRules}
    `
  }
}

export function registerKlappayButton(): void {
  if (!customElements.get(KLAPPAY_BUTTON_TAG)) {
    customElements.define(KLAPPAY_BUTTON_TAG, KlappayButtonElement)
  }
}
