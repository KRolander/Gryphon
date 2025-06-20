/* ----------------------- IMPORTS ----------------------- */
// Core
import { createApp } from "vue";
import { markRaw } from "vue";
import { createPinia } from "pinia";
import vuetify from "./plugins/vuetify";
import router from "./router/router";

// Components
import App from "./App.vue";

/* ----------------------- CONFIG ----------------------- */
// Create app
const app = createApp(App);

// Register Pinia store
const pinia = createPinia();
pinia.use(({ store }) => {
  store.$router = markRaw(router);
});

app.use(pinia);

// Vuetify
app.use(vuetify);

// Router
app.use(router);

// Mount app
app.mount("#app");

export { pinia };
