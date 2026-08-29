<script setup lang="ts">
// A type-only import is erased at build time — this side-effecting import
// is what actually registers <klappay-button> as a Custom Element.
import '@klappay/one'
import type { KlappayOneError, PaymentResult } from '@klappay/one'
import { computed, reactive, ref } from 'vue'

const runtimeConfig = useRuntimeConfig()

const origin = ref(runtimeConfig.public.klapOneOrigin)
const chargeId = ref('')
const applied = reactive({ origin: '', chargeId: '' })
const status = ref('')

const ready = computed(() => Boolean(origin.value && chargeId.value))

function generate(): void {
  applied.origin = origin.value
  applied.chargeId = chargeId.value
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
    <label>
      Klappay One origin
      <input v-model="origin" placeholder="https://klap.one" />
    </label>
    <label>
      Charge ID
      <input v-model="chargeId" placeholder="ch_123" />
    </label>
    <button type="button" :disabled="!ready" @click="generate">
      {{ ready ? 'Generate button' : 'Fill in origin and charge ID first' }}
    </button>

    <!-- Renders disabled on its own until both charge-id/origin are set —
         the lib handles that reactively, no need for a v-if here. -->
    <klappay-button
      :charge-id="applied.chargeId"
      :origin="applied.origin"
      @success="onSuccess"
      @error="onError"
      @cancel="onCancel"
    />
    <p v-if="status">{{ status }}</p>
  </div>
</template>
