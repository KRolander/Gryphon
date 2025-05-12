<script setup>
import NavBar from "./components/NavBar.vue";
</script>

<template>
  <v-app>
    <NavBar />

    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>

<style scoped></style>
