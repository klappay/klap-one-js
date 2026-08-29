import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import KlappayButtonDemo from './components/KlappayButtonDemo.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('KlappayButtonDemo', KlappayButtonDemo)
  },
} satisfies Theme
