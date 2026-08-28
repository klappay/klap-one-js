<script lang="ts">
import { PUBLIC_KLAP_ONE_ORIGIN } from '$env/static/public'
import { type KlappayOneError, type PaymentResult, configure } from '@klappay/one'

let chargeId: string | null = null
let status = ''
let loading = false

configure({ origin: PUBLIC_KLAP_ONE_ORIGIN })

async function start() {
  loading = true
  status = 'Creating charge…'

  const res = await fetch('/api/charges', { method: 'POST' })
  const data = await res.json()
  chargeId = data.chargeId

  status = 'Opening checkout…'
}

function onSuccess(event: CustomEvent<PaymentResult>) {
  status = `Paid! tx: ${event.detail.txHash}`
  loading = false
}

function onError(event: CustomEvent<KlappayOneError>) {
  status = `Error: ${event.detail.message}`
  loading = false
}

function onCancel() {
  status = 'Checkout closed.'
  loading = false
}
</script>

<svelte:head>
  <title>@klappay/one — SvelteKit example</title>
</svelte:head>

<main>
  <h1>Pay $25 in USDC</h1>

  {#if !chargeId}
    <button on:click={start} disabled={loading}>Start checkout</button>
  {:else}
    <klappay-button
      charge-id={chargeId}
      on:success={onSuccess}
      on:error={onError}
      on:cancel={onCancel}
    ></klappay-button>
  {/if}

  <p id="status">{status}</p>
</main>

<style>
  main {
    font-family: system-ui, sans-serif;
    max-width: 480px;
    margin: 80px auto;
    text-align: center;
  }

  #status {
    margin-top: 16px;
    color: #666;
  }
</style>
