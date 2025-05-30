/* ----------------------- IMPORTS ----------------------- */
// Core
import { createWebHistory, createRouter } from "vue-router";

// Views
import HomePage from "../views/HomePage.vue";
import DIDsPage from "../views/DIDsPage.vue";
import VCsPage from "../views/VCsPage.vue";
import AuthPage from "../views/AuthPage.vue";

/* ----------------------- CONFIG ----------------------- */
const routes = [
  { path: "/", component: HomePage },
  { path: "/dids", component: DIDsPage },
  { path: "/vcs", component: VCsPage },
  {
    path: "/auth",
    component: AuthPage,
    children: [{ path: "signup" }, { path: "login" }],
  },
];
const history = createWebHistory();

export default createRouter({ history, routes });
