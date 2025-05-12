<template>
  <v-app-bar>
    <v-app-bar-title class="text-h4 font-weight-bold cursor-pointer"
      >Gryphon</v-app-bar-title
    >

    <template v-slot:append>
      <v-btn text @click="navigateTo({ path: '/dids' })">DID's</v-btn>
      <v-btn text @click="navigateTo({ path: '/vcs' })">VC's</v-btn>
    </template>
  </v-app-bar>
</template>

<script lang="js">
export default {
  name: "NavBar",
  methods: {
    navigateTo(path) {
      this.$router.push(path);
    },
  }
}
</script>
<style lang="css" scoped></style>
