import type { KlapClient } from '@klappay/node'

export async function createDemoCharge(
  charges: KlapClient['charges'],
): Promise<{ chargeId: string }> {
  const charge = await charges.create({
    amount: 25,
    currency: 'USD',
    expiresIn: 3600,
    acceptedPayments: [{ token: 'USDC', network: 'base' }],
  })
  return { chargeId: charge.id }
}
