import { serveStatic } from '@hono/node-server/serve-static'
import { type KlapClient, createClient } from '@klappay/node'
import { Hono } from 'hono'

const klap = createClient({
  apiKey: process.env.KLAP_API_KEY,
  baseUrl: process.env.KLAP_BASE_URL,
})

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

const app = new Hono()

// The IIFE build, served straight from node_modules — always matches
// whatever version is actually installed, no copying into ./public.
app.use(
  '/vendor/one/*',
  serveStatic({
    root: './node_modules/@klappay/one/dist',
    rewriteRequestPath: (path) => path.replace(/^\/vendor\/one/, ''),
  }),
)

app.post('/api/charges', async (c) => {
  const result = await createDemoCharge(klap.charges)
  return c.json(result)
})

app.get('/api/config', (c) => c.json({ origin: process.env.KLAP_ONE_ORIGIN }))

app.use('/*', serveStatic({ root: './public' }))

export { app }
