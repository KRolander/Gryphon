<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center" max-width="800">
    <!-- Welcome message -->
    <div>
      <div class="mb-8 text-center">
        <div class="text-body-1 font-weight-light mb-n1">Welcome to</div>
        <h1 class="text-h2 font-weight-bold">Admin settings</h1>
      </div>
    </div>
    <!-- Root TAO fields -to add an @click for rules of setting TAO -->
    <v-container>
      <v-row class="w-100 border rounded" >
        <v-col cols="8">
          <v-text-field
              v-model="newRootTao"
              label="Add new root TAO (DID)"
              required
              :rules="didStructureRules"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-btn
              class="ma-2"
              variant="outlined"
          >
            Add
            <v-icon icon="mdi-plus-circle" end></v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- Add mapping fields -->
    <v-container>
      <v-row class="w-100 border rounded" >
        <v-col cols="8">
          <v-text-field
              v-model="newMapKey"
              label="Add new key for VC type"
              required
          ></v-text-field>
          <v-text-field
              v-model="newMapValue"
              label="Add new value for VC type"
              required
          ></v-text-field>
        </v-col>
        <v-col cols="4" class="d-flex align-center">
          <v-btn
              class="ma-2 mb-6"
              variant="outlined"
              @click="createMapping(newMapKey,newMapValue)"
          >
            Add
            <v-icon icon="mdi-plus-circle" end></v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

  </v-container>
</template>

<script lang="js">
//import {mapStores} from "pinia";
//import {useUserStore} from "@/store/userStore.js";
//import AuthService from "@/services/AuthService.js";
import VCService from "@/services/VCService.js";

export default {
  name: "AdminSettings",
  data() {
    return {
      newRootTao: "",
      newMapKey: "",
      newMapValue: "",
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
  methods: {
    async createMapping(key,value){
      await VCService.createMapping(key,value);
      this.newMapKey="";
      this.newMapValue="";
    }
  },

  mounted() {
    console.log("AdminPage mounted!");
  }

};
</script>

<style lang="css" scoped></style>
