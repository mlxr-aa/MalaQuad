import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/main.css'
import { initializePerformanceOptimizations } from './utils/performance'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 初始化性能优化
initializePerformanceOptimizations()

app.mount('#app')
