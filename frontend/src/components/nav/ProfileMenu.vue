<template>
  <v-menu>
    <!--------------------- ACTIVATOR --------------------->
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props">
        <v-avatar color="black">
          <v-icon icon="mdi-account-circle"></v-icon>
        </v-avatar>
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <div class="mx-auto text-center">
          <h3>{{ userStore.getUsername }}</h3>
          <p class="text-caption mt-1">{{ userStore.getEmail }}</p>
          <v-divider class="my-3"></v-divider>

          <v-btn variant="text" rounded @click="userStore.logout()"> Logout </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>
<script lang="js">
/* ======================= IMPORTS ======================= */
// pinia
import { mapStores } from "pinia";

// stores
import { useUserStore } from "@/store/userStore";

/* ======================= CONFIG ======================= */
export default {
  computed: {
    ...mapStores(useUserStore),
  },
  async mounted() {
    await this.userStore.loadUser();
  },
};
</script>
<style scoped></style>
