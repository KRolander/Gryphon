/* ----------------------- IMPORTS ----------------------- */
// Core
import { createApp } from "vue";
import vuetify from "./plugins/vuetify";
import router from "./router/router";

// Authentication
import { vueKeycloak } from "@josempgon/vue-keycloak";

// Components
import App from "./App.vue";

/* ----------------------- CONFIG ----------------------- */
// Create app
const app = createApp(App);

// Vuetify
app.use(vuetify);

// Router
app.use(router);

// Keycloak
app.use(vueKeycloak, async () => {
  return {
    config: {
      url: "http://localhost:8080",
      realm: "gryphon",
      clientId: "web-ui",
    },
  };
});

// Mount app
app.mount("#app");
