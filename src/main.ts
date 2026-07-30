import { createApp } from 'vue'
import '@/styles/variables.css'
import '@/styles/base.css'
import '@/styles/layout.css'
import '@/styles/components.css'
import App from './app.vue'
import router from './router'

createApp(App).use(router).mount('#app')
