import { KLAP_API_KEY, KLAP_BASE_URL } from '$env/static/private'
import { createDemoCharge } from '$lib/server/create-demo-charge'
import { createClient } from '@klappay/node'
import { json } from '@sveltejs/kit'

const klap = createClient({ apiKey: KLAP_API_KEY, baseUrl: KLAP_BASE_URL })

export async function POST() {
  const result = await createDemoCharge(klap.charges)
  return json(result)
}
