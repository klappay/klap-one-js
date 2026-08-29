<script setup lang="ts">
import { onMounted } from 'vue'

withDefaults(
  defineProps<{
    variant?: 'white' | 'yellow' | 'black'
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { variant: 'black', size: 'md' },
)

onMounted(() => {
  import('@klappay/one')
})
</script>

<template>
  <klappay-button
    charge-id="demo-charge"
    origin="https://example.com"
    :variant="variant"
    :size="size"
  />
</template>
