/* ----------------------- IMPORTS ----------------------- */
// Core
import { createWebHistory, createRouter } from "vue-router";

// Views
import HomePage from "../views/HomePage.vue";
import DIDsPage from "../views/DIDsPage.vue";
import VCsPage from "../views/VCsPage.vue";

/* ----------------------- CONFIG ----------------------- */
const routes = [
  { path: "/", component: HomePage },
  { path: "/dids", component: DIDsPage },
  { path: "/vcs", component: VCsPage },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
