<script lang="ts">
import { env } from '$env/dynamic/public'
// A type-only import is erased at build time — this side-effecting import
// is what actually registers <klappay-button> as a Custom Element.
import '@klappay/one'
import type { KlappayOneError, PaymentResult } from '@klappay/one'

// biome-ignore lint/style/useConst: mutated by bind:value in the template, invisible to biome's script-only analysis
let origin = env.PUBLIC_KLAP_ONE_ORIGIN ?? ''
// biome-ignore lint/style/useConst: mutated by bind:value in the template, invisible to biome's script-only analysis
let chargeId = ''
let applied = { origin: '', chargeId: '' }
let status = ''

$: ready = Boolean(origin && chargeId)

function generate() {
  applied = { origin, chargeId }
}

function onSuccess(event: CustomEvent<PaymentResult>) {
  status = `Paid! tx: ${event.detail.txHash}`
}

function onError(event: CustomEvent<KlappayOneError>) {
  status = `Error: ${event.detail.message}`
}

function onCancel() {
  status = 'Checkout closed.'
}
</script>

<svelte:head>
  <title>@klappay/one — SvelteKit example</title>
</svelte:head>

<main>
  <h1>Pay $25 in USDC</h1>

  <label>
    Klappay One origin
    <input bind:value={origin} placeholder="https://klap.one" />
  </label>
  <label>
    Charge ID
    <input bind:value={chargeId} placeholder="ch_123" />
  </label>
  <button on:click={generate} disabled={!ready}>
    {ready ? 'Generate button' : 'Fill in origin and charge ID first'}
  </button>

  <!-- Renders disabled on its own until both charge-id/origin are set —
       the lib handles that reactively, no need for an {#if} here. -->
  <klappay-button
    charge-id={applied.chargeId}
    origin={applied.origin}
    on:success={onSuccess}
    on:error={onError}
    on:cancel={onCancel}
  ></klappay-button>

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
