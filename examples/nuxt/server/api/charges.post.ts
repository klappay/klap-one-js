import { createClient } from '@klappay/node'
import { createDemoCharge } from '../utils/create-demo-charge'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const klap = createClient({ apiKey: config.apiKey, baseUrl: config.baseUrl })
  return createDemoCharge(klap.charges)
})
