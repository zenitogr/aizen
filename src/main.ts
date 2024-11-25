import { createApp } from "vue";
import { createPinia } from 'pinia'
import App from "./App.vue";
import "./styles/base.css";
import { persistencePlugin } from './plugins/persistencePlugin'
import { Storage } from './utils/storage'

async function initApp() {
  await Storage.init()
  
  const app = createApp(App)
  const pinia = createPinia()
  
  pinia.use(persistencePlugin)
  app.use(pinia)
  
  app.mount("#app")
}

initApp().catch(console.error)
