import { describe, expect, it, vi } from 'vitest'
import { createDemoCharge } from './server'

describe('createDemoCharge', () => {
  it('requests a USDC/base charge and returns its id', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'ch_test_123' })
    const charges = { create } as unknown as Parameters<typeof createDemoCharge>[0]

    const result = await createDemoCharge(charges)

    expect(result).toEqual({ chargeId: 'ch_test_123' })
    expect(create).toHaveBeenCalledWith({
      amount: 25,
      currency: 'USD',
      expiresIn: 3600,
      acceptedPayments: [{ token: 'USDC', network: 'base' }],
    })
  })

  it('propagates a failure from the underlying client instead of swallowing it', async () => {
    const charges = {
      create: vi.fn().mockRejectedValue(new Error('KLAP_API_KEY is not set')),
    } as unknown as Parameters<typeof createDemoCharge>[0]

    await expect(createDemoCharge(charges)).rejects.toThrow('KLAP_API_KEY is not set')
  })
})
