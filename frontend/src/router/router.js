/* ========================= IMPORTS ========================= */
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

/* ========================= CONFIG ========================= */
/* ---------------------- ROUTER ---------------------- */
const routes = [
  {
    name: "home",
    path: "/",
    component: HomePage,
    meta: { requiresAuth: true },
  },
  {
    name: "DIDs",
    path: "/dids",
    component: DIDsPage,
    meta: { requiresAuth: true },
  },
  {
    name: "VCs",
    path: "/vcs",
    component: VCsPage,
    meta: { requiresAuth: true },
  },

  //! Every child of the auth route will:
  //! - be protected by the auth guard
  // //TODO: implement auth guard

  //! - will not show the nav bar

  {
    name: "auth",
    path: "/auth",
    component: AuthPage,
    meta: { onlyWhenLoggedOut: true }, // Accessible only when logged out
    children: [
      { name: "signup", path: "signup", component: SignupPage },
      { name: "login", path: "login", component: LoginPage },
      {
        name: "recover-password",
        path: "recover-password",
        component: RecoverPasswordPage,
      },
      {
        name: "catch-all",
        path: "/:pathMatch(.*)*",
        redirect: { name: "signup" },
      }, // Redirect to login if no match
    ],
    redirect: { name: "login" }, // Redirect to signup if no child route is matched
  },
];
const history = createWebHistory();
const router = createRouter({ history, routes });

/* ---------------------- GUARDS ---------------------- */
router.beforeEach((to, from, next) => {
  console.log(to);
  let isAuthenticated = false; // Replace with actual authentication check

  // Get token from localStorage and check it's validity
  const token = localStorage.getItem("access_token");
  if (token) {
    // Here you would typically verify the token's validity
    // For example, check if it's expired or valid
    // isAuthenticated = verifyToken(token);
    isAuthenticated = true; // Simulating an authenticated state for this example
  }

  //? Branch logic: Going to a route that requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: "auth" }); // Redirect to auth page if not authenticated
  } else if (to.meta.onlyWhenLoggedOut && isAuthenticated) {
    next({ name: "home" }); // Redirect to home if already authenticated
  } else {
    next(); // Proceed to the route
  }
});
export default router;
