<script setup lang="ts">
import { configure } from '@klappay/one'
import type { KlappayOneError, PaymentResult } from '@klappay/one'
import { ref } from 'vue'

const chargeId = ref<string | null>(null)
const status = ref('')

const runtimeConfig = useRuntimeConfig()
configure({ origin: runtimeConfig.public.klapOneOrigin })

async function start(): Promise<void> {
  status.value = 'Creating charge…'
  const data = await $fetch('/api/charges', { method: 'POST' })
  chargeId.value = data.chargeId
}

function onSuccess(event: Event): void {
  const result = (event as CustomEvent<PaymentResult>).detail
  status.value = `Paid! tx: ${result.txHash}`
}

function onError(event: Event): void {
  const error = (event as CustomEvent<KlappayOneError>).detail
  status.value = `Error: ${error.message}`
}

function onCancel(): void {
  status.value = 'Checkout closed.'
}
</script>

<template>
  <div>
    <button v-if="!chargeId" type="button" @click="start">Start checkout</button>
    <klappay-button
      v-else
      :charge-id="chargeId"
      @success="onSuccess"
      @error="onError"
      @cancel="onCancel"
    />
    <p v-if="status">{{ status }}</p>
  </div>
</template>
