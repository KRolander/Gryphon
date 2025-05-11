/* ----------------------- IMPORTS ----------------------- */
// Core
import { createApp } from 'vue'
import vuetify from './plugins/vuetify'
import router from './router/router'

// Components
import App from './App.vue'

/* ----------------------- CONFIG ----------------------- */
createApp(App)
    .use(vuetify)
    .use(router)
    .mount('#app')
