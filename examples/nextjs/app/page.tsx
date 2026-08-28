import { CheckoutButton } from './CheckoutButton'

export default function Home() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 480,
        margin: '80px auto',
        textAlign: 'center',
      }}
    >
      <h1>Pay $25 in USDC</h1>
      <CheckoutButton />
    </main>
  )
}
