/* ----------------------- IMPORTS ----------------------- */
// Core
import { createWebHistory, createRouter } from "vue-router";

// Views
import HomePage from "../views/HomePage.vue";
import DIDsPage from "../views/DIDsPage.vue";
import VCsPage from "../views/VCsPage.vue";

// Auth
import AuthPage from "../views/AuthPage.vue";
import SignupPage from "../components/auth/SignupForm.vue";
import LoginPage from "../components/auth/LoginForm.vue";
import RecoverPasswordPage from "../components/auth/ForgotPasswordForm.vue";

/* ----------------------- CONFIG ----------------------- */
const routes = [
  { name: "home", path: "/", component: HomePage },
  { name: "DIDs", path: "/dids", component: DIDsPage },
  { name: "VCs", path: "/vcs", component: VCsPage },
  {
    path: "/auth",
    component: AuthPage,
    children: [
      { name: "signup", path: "signup", component: SignupPage },
      { name: "login", path: "login", component: LoginPage },
      {
        name: "recover-password",
        path: "recover-password",
        component: RecoverPasswordPage,
      },
      { name: "catch-all", path: "/:pathMatch(.*)*", redirect: "/auth/login" }, // Redirect to login if no match
    ],
  },
];
const history = createWebHistory();

export default createRouter({ history, routes });
