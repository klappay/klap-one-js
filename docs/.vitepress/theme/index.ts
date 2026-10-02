import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import KlappayButtonDemo from './components/KlappayButtonDemo.vue'
import KlappayButtonPlayground from './components/KlappayButtonPlayground.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('KlappayButtonDemo', KlappayButtonDemo)
    app.component('KlappayButtonPlayground', KlappayButtonPlayground)
  },
} satisfies Theme
