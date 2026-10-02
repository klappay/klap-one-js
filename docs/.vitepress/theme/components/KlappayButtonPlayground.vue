<script setup lang="ts">
import KlappayButtonDemo from './KlappayButtonDemo.vue'

const backgrounds = [
  { name: 'White page', color: '#ffffff', text: '#09090b' },
  { name: 'Paper page', color: '#f4f4f5', text: '#09090b' },
  { name: 'Ink page', color: '#09090b', text: '#f4f4f5' },
  { name: 'Mid-gray page', color: '#71717a', text: '#ffffff' },
] as const

const variants = ['black', 'white'] as const
const sizes = ['sm', 'md', 'lg'] as const
const labels = ['full', 'short'] as const
</script>

<template>
  <div class="playground">
    <section
      v-for="bg in backgrounds"
      :key="bg.name"
      class="surface"
      :style="{ background: bg.color, color: bg.text }"
    >
      <h3>{{ bg.name }} <code>{{ bg.color }}</code></h3>
      <div v-for="variant in variants" :key="variant" class="row">
        <span class="row-label">{{ variant }}</span>
        <template v-for="label in labels" :key="label">
          <KlappayButtonDemo
            v-for="size in sizes"
            :key="size"
            :variant="variant"
            :size="size"
            :label="label"
          />
        </template>
        <KlappayButtonDemo :variant="variant" disabled />
      </div>
    </section>

    <section class="surface" style="background: #ffffff; color: #09090b">
      <h3>CSS custom properties</h3>
      <div class="row">
        <span class="row-label">radius 0</span>
        <div style="--klappay-radius: 0"><KlappayButtonDemo /></div>
        <div style="--klappay-radius: 0"><KlappayButtonDemo variant="white" /></div>
        <span class="row-label">pill</span>
        <div style="--klappay-radius: 999px"><KlappayButtonDemo /></div>
        <div style="--klappay-radius: 999px"><KlappayButtonDemo variant="white" /></div>
        <span class="row-label">height 56px</span>
        <div style="--klappay-button-height: 56px"><KlappayButtonDemo size="lg" /></div>
        <span class="row-label">serif</span>
        <div style="--klappay-font-family: Georgia, serif"><KlappayButtonDemo /></div>
      </div>
    </section>

    <section class="surface" style="background: #ffffff; color: #09090b">
      <h3>Narrow container <code>160px</code></h3>
      <div class="row top">
        <figure class="narrow">
          <KlappayButtonDemo />
          <figcaption>full, truncated</figcaption>
        </figure>
        <figure class="narrow">
          <KlappayButtonDemo variant="white" size="lg" />
          <figcaption>full, truncated</figcaption>
        </figure>
        <figure class="narrow">
          <KlappayButtonDemo label="short" />
          <figcaption>short, fits</figcaption>
        </figure>
      </div>
    </section>
  </div>
</template>

<style scoped>
.playground {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 24px 0;
}

.surface {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
}

.surface h3 {
  margin: 0 0 16px;
  padding: 0;
  border: none;
  font-size: 14px;
  color: inherit;
}

.surface h3 code {
  background: none;
  color: inherit;
  opacity: 0.6;
  padding: 0;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.row-label {
  min-width: 48px;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  opacity: 0.7;
}

.row.top {
  align-items: flex-start;
}

.narrow {
  width: 160px;
  margin: 0;
  padding: 12px;
  border: 1px dashed #a1a1aa;
  border-radius: 8px;
}

.narrow figcaption {
  margin-top: 8px;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  opacity: 0.7;
}
</style>
