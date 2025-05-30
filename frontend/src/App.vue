<script>
/* ======================= IMPORTS ======================= */
import NavBar from "./components/NavBar.vue";

/* ======================= CONFIG ======================= */
export default {
  components: {
    NavBar,
  },
  computed: {
    showNavBar() {
      // Show NavBar only if the current route is not 'auth'
      console.log("Current route path:", this.$route.path);
      return !this.$route.path.startsWith("/auth");
    },
  },
};
</script>

<template>
  <v-app>
    <NavBar v-if="showNavBar" />

    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>

<style scoped></style>
