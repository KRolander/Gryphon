/* ----------------------- IMPORTS ----------------------- */
// Core
import { createWebHistory, createRouter } from 'vue-router'

// Views
import HomePage from '../views/HomePage.vue'

/* ----------------------- CONFIG ----------------------- */
const routes = [
  { path: '/', component: HomePage }
];

export default createRouter({
  history: createWebHistory(),
  routes,
});