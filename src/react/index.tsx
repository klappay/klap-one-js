import { useEffect, useRef } from 'react'
import { createKlappayOne } from '../core/klappay-one'
import type {
  KlappayButtonLabel,
  KlappayButtonSize,
  KlappayButtonVariant,
  KlappayOneConfig,
  KlappayOneError,
  PaymentResult,
} from '../core/types'
import { registerKlappayButton } from '../ui/klappay-button'

registerKlappayButton()

export function useKlappayOne(config: KlappayOneConfig): { open: () => void } {
  const configRef = useRef(config)
  configRef.current = config

  return {
    open: () => createKlappayOne(configRef.current).open(),
  }
}

export interface KlappayButtonProps {
  chargeId: string
  origin?: string
  locale?: string
  variant?: KlappayButtonVariant
  size?: KlappayButtonSize
  label?: KlappayButtonLabel
  onSuccess?: (result: PaymentResult) => void
  onError?: (error: KlappayOneError) => void
  onCancel?: () => void
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'klappay-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'charge-id'?: string
        origin?: string
        locale?: string
        variant?: KlappayButtonVariant
        size?: KlappayButtonSize
        label?: KlappayButtonLabel
      }
    }
  }
}

export function KlappayButton(props: KlappayButtonProps): JSX.Element {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onSuccess(event: Event): void {
      props.onSuccess?.((event as CustomEvent<PaymentResult>).detail)
    }
    function onError(event: Event): void {
      props.onError?.((event as CustomEvent<KlappayOneError>).detail)
    }
    function onCancel(): void {
      props.onCancel?.()
    }

    el.addEventListener('success', onSuccess)
    el.addEventListener('error', onError)
    el.addEventListener('cancel', onCancel)

    return () => {
      el.removeEventListener('success', onSuccess)
      el.removeEventListener('error', onError)
      el.removeEventListener('cancel', onCancel)
    }
  }, [props.onSuccess, props.onError, props.onCancel])

  return (
    <klappay-button
      ref={ref}
      charge-id={props.chargeId}
      origin={props.origin}
      locale={props.locale}
      variant={props.variant}
      size={props.size}
      label={props.label}
    />
  )
}
