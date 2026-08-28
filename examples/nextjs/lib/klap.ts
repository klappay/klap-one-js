import { createClient } from '@klappay/node'

export const klap = createClient({
  apiKey: process.env.KLAP_API_KEY,
  baseUrl: process.env.KLAP_BASE_URL,
})
