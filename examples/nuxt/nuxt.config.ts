// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    apiKey: process.env.KLAP_API_KEY,
    baseUrl: process.env.KLAP_BASE_URL,
    public: {
      klapOneOrigin: process.env.KLAP_ONE_ORIGIN,
    },
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'klappay-button',
    },
  },
})
