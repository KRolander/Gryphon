<template>
  <v-app-bar>
    <v-app-bar-title class="text-h4 font-weight-bold" @click="navigateTo({ path: '/' })"
      ><span class="cursor-pointer">Gryphon</span></v-app-bar-title
    >

    <template v-slot:append>
      <v-btn text @click="navigateTo({ path: '/dids' })">DID's</v-btn>
      <v-btn text @click="navigateTo({ path: '/vcs' })">VC's</v-btn>
      <ProfileMenu />
    </template>
  </v-app-bar>
</template>

<script lang="js">
/* ======================= IMPORTS ======================= */
// components
import ProfileMenu from "./ProfileMenu.vue";

/* ======================= CONFIG ======================= */
export default {
  name: "NavBar",
  components: {
    ProfileMenu,
  },
  methods: {
    navigateTo(path) {
      this.$router.push(path);
    },
  },
};
</script>
<style lang="css" scoped></style>
