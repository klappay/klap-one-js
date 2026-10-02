<script setup lang="ts">
import { onMounted } from 'vue'

withDefaults(
  defineProps<{
    variant?: 'white' | 'black'
    size?: 'sm' | 'md' | 'lg'
    label?: 'full' | 'short'
    disabled?: boolean
  }>(),
  { variant: 'black', size: 'md', label: 'full', disabled: false },
)

onMounted(() => {
  import('@klappay/one')
})
</script>

<template>
  <klappay-button
    :charge-id="disabled ? undefined : 'demo-charge'"
    origin="https://example.com"
    :variant="variant"
    :size="size"
    :label="label"
  />
</template>
