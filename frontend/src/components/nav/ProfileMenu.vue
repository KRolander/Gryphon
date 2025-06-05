<template>
  <v-menu>
    <!--------------------- ACTIVATOR --------------------->
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props">
        <v-avatar color="black" size="large">
          <span class="text-h5">AL</span>
        </v-avatar>
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <div class="mx-auto text-center">
          <v-avatar color="brown">
            <span class="text-h5">AL</span>
          </v-avatar>
          <h3>Alexandru Lolea</h3>
          <p class="text-caption mt-1">alex@test.com</p>
          <v-divider class="my-3"></v-divider>

          <v-btn variant="text" rounded @click="logout"> Logout </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>
<script lang="js">
export default {

}
</script>
<style scoped></style>
