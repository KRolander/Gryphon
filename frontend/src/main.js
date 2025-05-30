/* ----------------------- IMPORTS ----------------------- */
// Core
import { createApp } from "vue";
import vuetify from "./plugins/vuetify";
import router from "./router/router";

// Components
import App from "./App.vue";

/* ----------------------- CONFIG ----------------------- */
// Create app
const app = createApp(App);

// Vuetify
app.use(vuetify);

// Router
app.use(router);

// Mount app
app.mount("#app");
