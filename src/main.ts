import { createApp } from 'vue'
import '@/styles/variables.css'
import '@/styles/base.css'
import '@/styles/layout.css'
import '@/styles/components.css'
import '@/styles/accessibility.css'
import '@/blueprint-editor/editor.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
