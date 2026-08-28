'use client'

import type { KlappayOneError, PaymentResult } from '@klappay/one'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const KlappayButton = dynamic(() => import('@klappay/one/react').then((mod) => mod.KlappayButton), {
  ssr: false,
})

const klapOneOrigin = process.env.NEXT_PUBLIC_KLAP_ONE_ORIGIN ?? ''

export function CheckoutButton() {
  const [chargeId, setChargeId] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)

  async function start() {
    setCreating(true)
    setStatus('Creating charge…')

    const res = await fetch('/api/charges', { method: 'POST' })
    const data = await res.json()

    setChargeId(data.chargeId)
    setCreating(false)
    setStatus('Checkout ready.')
  }

  if (!chargeId) {
    return (
      <div>
        <button type="button" onClick={start} disabled={creating}>
          Start checkout
        </button>
        <p>{status}</p>
      </div>
    )
  }

  return (
    <div>
      <KlappayButton
        chargeId={chargeId}
        origin={klapOneOrigin}
        onSuccess={(result: PaymentResult) => setStatus(`Paid! tx: ${result.txHash}`)}
        onError={(error: KlappayOneError) => setStatus(`Error: ${error.message}`)}
        onCancel={() => setStatus('Checkout closed.')}
      />
      <p>{status}</p>
    </div>
  )
}
