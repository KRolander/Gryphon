<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center" max-width="800">
    <!-- Welcome message -->
    <div>
      <div class="mb-8 text-center">
        <div class="text-body-1 font-weight-light mb-n1">Welcome to</div>
        <h1 class="text-h2 font-weight-bold">Admin settings</h1>
      </div>
    </div>

    <div>
      <v-text-field
          v-model="newRootTao"
          label="Add new root TAO"
          required
          :rules="didStructureRules"
      ></v-text-field>
      <div class="d-flex justify-end">
        <v-btn
            class="ma-2 mt-n4"
            variant="outlined"
            :disabled="!valid"
            @click=logic for root TAO
        >
          Add
          <v-icon icon="mdi-plus-circle" end></v-icon>
        </v-btn>
      </div>
    </div>


  </v-container>
  <v-btn>

  </v-btn>
</template>

<script lang="js">
import {mapStores} from "pinia";
import {useUserStore} from "@/store/userStore.js";
import AuthService from "@/services/AuthService.js";

export default {
  name: "AdminSettings",
  data() {
    return {
      newRootTao: "",
      didStructureRules: [
        (value) => {
          if (value && value.startsWith("did:hlf:")) {
            return true;
          }
          return "A DID should start with did:hlf:";
        },
        (value) => {
          if (value.length < 30) {
            return "DID too short, check again";
          } else if (value.length > 31) {
            return "DID too long, check again";
          }
          return true;
        },
      ],
    }
  },

};
</script>

<style lang="css" scoped></style>
