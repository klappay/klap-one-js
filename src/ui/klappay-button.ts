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
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAKPUlEQVR4AeyYCVCV1xXHv/fgIYgiFjeCGwpIEBVXNrUYFNCIC4iOjNU2narVgNqimDhNmWSMY+g0nbHGLZXOqFUZk7CJtVKqIHXBESrihoLiRgUBAdl5r7/z1WceROBpZjqdTpnvvHu/c88953/PPefc+6FV/sv//g/w+27Q/5QHNRERERYrV67UxcXFqQuLioqyi4yMDIO/Gb4jfCtTj8G3gKeNjY3tEx4e/rM5c+akLFu2zA+etcjFxMTYRkYuDl60aNGnq1at8oDfU/impBoyZXTWB4CNg4ODj8FgCG5sbOyDMsuysrJp6enpicnJydtu3bqVXl9fPwC+VoAJ+J49e/pXVlYOfvLkSdipU6d2Q6GlpaVfMd+G8R4lJSWeOTkXklJSUj64cOFCFvwBHe2bDfDBgweTjh8/nnns2LHk3NzcHSjr3dLSMrS1tVVLq1y8eNEL8MswYD1o0CBLgHwK+Mzs7OxzTU1NgchoGVdsbGwM1tbWhra2tr737t375v79+9aMKQ8fPuzbq1evNwdYV1c3pry83Kq6ulp76dKlyGfPnkW5uLhkj3QeWQsopaGhQQH8R3h1vKWlpRbg7shYFBYWvmVhYWHrNsqtjlbx9vb+NfLNePXDK1euONJXhD937tyc/v37X5V3UzLbg3glv1+/fq0yuba2VpOUlLQF0E6r16zeYG9vb9BqtQresCkuLv5DH/5mzpz5OUANeEoBSODiiPC1fn5+Fb179/4TC3VnF1ayCEWj0Siurq7NY8aMiWExTmz9uxs3bnSVUBFbZgP08PDIW7p06T62waDRaBSMWOXl5YmxPH9//yviBb1er5w/f96N7YrmPdvHx/sJrXLjxo3eubmXl02dOnUBY3bMS3r06FEPAcAilOnTp/+NWK26fPnyicOHDyezQxl2dnbqeLcAWYk11EuUEUMbAwMDr4tSAZOfn/+DnJyc/ZMmTfp4wIABbeJFvKpJTEyMJb7e8fQc81mPHj0MEmNnzpyZ+fz5cwe2dk1BQcFg8Z6Ax3uNjo6OmwC3G6+OJIQsbt++7aTT6fqKzW4BIuyRlZW1F6Wz8Z4Gby0ZOHBgq4Bpbm5WMOyFTGRYWNg+wCgsQgGIFk/uJCROItsghgR40Z2ij5CZDDgNfwp9A6GQQDYHnT17doYsBGDKrFmzsqysrMplXpcAMWaD8UwmL4USi4qKtmL89pIlS6IJ6DYxIiBT09LCyPIqkqZKvCJxR1a/VVhY8NuxY8fmAUQRXsZfMiYCLs/JyalJgLi7uzeiLxXdn9BqZNHOzs5N8H/x+PHjtm4BIqDX6Sz1tEpFRYWWxIgG8FadTvc123qOcqF6rLamRgOg2NmzZ6eQBAaRF0CnTv11lqen53lKi57FKpQbhZ2IomAnsK0txGT0tevXdhMO1jJObhkWLlz48fDhwwsIK9Vulx7EUPOUKd7vsWLVW9Q+5eTJk+uvXbu2bvLkye+z3eUSj6KcFWsp2IvgF4oXhUc8aQ4cOBCNp1XQwiNhbInDfpSVD9la77zLeUMlnlm0EhAQUEAY7UJ/DwBK7FMbQNHZI4qHDRt2AiB7yCr0G5SnT59qKb6b2dIfDx069JfwVfBihBCwxRsjmaeqZIJy9+5dXWVlpYXK4Ee8mJaWFo6HB6LrXYk7kcdOM+EQA8+eCvE5pWwL4nbdeVCJjo5uGjdu3Kb5oaGpRm9hUHPkyJF1BL7Hhg3r9ojHxAhGFY48G2lRrj7Cl46xlb7EW2pq6nq2fz3b2cSRaOA8jrKysrpDQp7eu3fvyoSEhC3IBXcL8IXCBgudbm1QUFCxBPILngZPbiopuVfr7+9fZOTLmHhOWiFj39gKT4gTx5IS9UcfH5898+bNyyV5sjMyMv5M6VK3nCRsIXYrzAJIPOgHDx5cRmL4QpXiSdlSYklLYd3k7DysoiMAAdEViZdv3rxpQxXwHTVq1HtkcjqAXYVva2trwBn7KFNnzQIohgDZevr06copU6Ys5VbTJtsqykgczaFDh31NAZpup2lf9AgZeXhNOXHixCTiNpxYVYu3lKQFCxakE9+xhFKL2QBFMQBbAZfBHXAdrXpyCDAJdGlFRqizvowJGcelJc40JNf77MxFwBm4TJRyrK6B34BT9K8FUJTLJDc3NwfqVQoK1cNe+G9KAvLq1av9uCzsJZZLKFP+mzdvLhU7ovO1ATJJc+fOHVfKzNsc8hlSv+C98SMAuZZpSJp5Xl5ec6md/zRVpgJESC6TVrRS0fvSqpcDU0HTPrGnOXfu3CiyzJZjqUzi0XT8dfuScNxwgkiKKkpMi+l8AaaDMRtKhgohuTRmA9KS/ssHl1vGx8fbxsfH92eVh8iy8xTUCdOmTdvD9jwzLTMvJ9ExJgTdTh+R4QZuyyfD0I5C4sFBMH8P+UH2UAG0D1LPQlqF65MFx9Iojqn0/fv33+UGk0TmuRCL/9BZWnq5uLhc6gwgCxUVXZLIyAlDRfDsKCgAH8H0hzyg4dB8aDer0tOqDxcFO87anIMHD06Xk4KSYMVHTn/O2Sk7v/hiPqdCINuuysoPc6V5LaLkaGpqagRDu3lalMm1pgzuY+g51AzvJTjeFbZUQgG2Rl4ViRkhlCpCUmbUgRc/4pEXXbObESNGNBHLhzpOEA9KqdBj3UjoN2j4sYAkcbR4r45q77VixYpfUQaKhgwZ0kiCKMZtFbDIdtRt1jt2FWqqnpj+Oe3NjpNUgKZMDMnNow88uU2cpnXcsWNHExl2jzvcZxMnTvSlHPgFBwdvJTmeS5kxAhVjyKuPaV9lvOJHZGQ+98hDXBS+jouLq+8o1g4g4CRzpyL0DRQDyX8KJAQUJuuh5p07dz7lQztvxowZnwDSNygk5AClportQfzbB13fvnTSkzM3NDT0CLeateyI+vnaUbQdQAal3CTSToQOQCGQ+m1A2+7hGsY533zbydGxaMKkCam8fynfH+IRU0Hxkum79MXj/RwcWpcvXx5L9v6Uf43Usfh2cS9yQh0BlsI8Cf0Q2ghVQa+cCN/AFb2Jlf+mpromlc/IdwICAop9vb13ccJkcZ42cs9T5OYj3hWSPtcoA97P9vH1DeZjfzch0yi6oFc+HQFeR2oVJAW7gdXLbdl4Xe/Jtv0IGgGp82TVAnL8+PFpfJ8EcgvOr6yuXsQZ7RYSEpITFRWVGhER8XcS4CKgs7nmJ/BtHUyihXNRzaGm1ooO7HX6qIaMowCSEiPApFWBydgLQK70fwf9BPp3vaEjBqBGDJaOHj16LV9lwfb29l/ynesq9ZHTZhje/ACAc7mZy3dM5rZt28ol8Zje7dMOYBfS8pW/i3H599hB2u88gNRv3779GR9O+UePHo3LzMx8m1uKMx9Z7vHx8WcYr4HqFy9erCbddxR0wjAX4GTmu0NfQcV4ulMjjMm/RiQ06pEt570O6lQemS4fcwHKUSiKDvNjtjGAvQwT5r3RYy7AY2hfDZ2BvrdRdJj9mAUQTxRBiZBs138U4L8AAAD//z/gO6kAAAAGSURBVAMA419OnIILUdEAAAAASUVORK5CYII='

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
