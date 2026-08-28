import { env } from '$env/dynamic/private'
import { createDemoCharge } from '$lib/server/create-demo-charge'
import { createClient } from '@klappay/node'
import { json } from '@sveltejs/kit'

const klap = createClient({ apiKey: env.KLAP_API_KEY, baseUrl: env.KLAP_BASE_URL })

export async function POST() {
  const result = await createDemoCharge(klap.charges)
  return json(result)
}
