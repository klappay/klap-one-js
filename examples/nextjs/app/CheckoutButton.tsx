'use client'

import type { KlappayOneError, PaymentResult } from '@klappay/one'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const KlappayButton = dynamic(() => import('@klappay/one/react').then((mod) => mod.KlappayButton), {
  ssr: false,
})

const defaultOrigin = process.env.NEXT_PUBLIC_KLAP_ONE_ORIGIN ?? ''

export function CheckoutButton() {
  const [origin, setOrigin] = useState(defaultOrigin)
  const [chargeId, setChargeId] = useState('')
  const [applied, setApplied] = useState({ origin: '', chargeId: '' })
  const [status, setStatus] = useState('')

  const ready = Boolean(origin && chargeId)

  return (
    <div>
      <label>
        Klappay One origin
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="https://klap.one"
        />
      </label>
      <label>
        Charge ID
        <input
          value={chargeId}
          onChange={(e) => setChargeId(e.target.value)}
          placeholder="ch_123"
        />
      </label>
      <button type="button" onClick={() => setApplied({ origin, chargeId })} disabled={!ready}>
        {ready ? 'Generate button' : 'Fill in origin and charge ID first'}
      </button>

      {/* Renders disabled on its own until both charge-id/origin are set —
          the lib handles that reactively, no need to conditionally mount it. */}
      <KlappayButton
        chargeId={applied.chargeId}
        origin={applied.origin}
        variant="yellow"
        size="lg"
        onSuccess={(result: PaymentResult) => setStatus(`Paid! tx: ${result.txHash}`)}
        onError={(error: KlappayOneError) => setStatus(`Error: ${error.message}`)}
        onCancel={() => setStatus('Checkout closed.')}
      />
      <p>{status}</p>
    </div>
  )
}
