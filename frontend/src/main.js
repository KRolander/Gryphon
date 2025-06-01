/* ----------------------- IMPORTS ----------------------- */
// Core
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'
import router from './router/router'

// Components
import App from './App.vue'

/* ----------------------- CONFIG ----------------------- */
createApp(App)
    .use(createPinia())
    .use(vuetify)
    .use(router)
    .mount('#app')
