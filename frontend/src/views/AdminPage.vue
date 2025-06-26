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
    <v-container v-if="userStore.isMasterAdmin">
      <v-row class="w-100 border rounded">
        <v-col cols="8">
          <v-text-field
            v-model="newRootTao"
            label="Add new root TAO (DID)"
            required
            :rules="didStructureRules"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-btn class="ma-2" variant="outlined" @click="setRootTAO(newRootTao)">
            Add
            <v-icon icon="mdi-plus-circle" end></v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- Add mapping fields -->
    <v-container>
      <v-row class="w-100 border rounded">
        <v-col cols="8">
          <v-text-field v-model="newMapKey" label="Add new key for VC type" required></v-text-field>
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
            @click="createMapping(newMapKey, newMapValue)"
            :disabled="loading"
          >
            <span v-if="!loading" class="d-flex justify-center align-center"
              >Add
              <v-icon icon="mdi-plus-circle" end></v-icon>
            </span>
            <v-progress-circular v-else color="primary" indeterminate></v-progress-circular>
          </v-btn>
        </v-col>
        <v-alert v-if="alert" :color="alertColor">
          {{ alertMessage }}
        </v-alert>
      </v-row>
    </v-container>

    <!-- Add button that takes you to keycloak -->
    <v-btn v-if="userStore.isMasterAdmin" cols="4" class="d-flex align-center" @click="goToKeycloak"
      >To Keycloak</v-btn
    >
  </v-container>
</template>

<script lang="js">
//import {mapStores} from "pinia";
//import {useUserStore} from "@/store/userStore.js";
//import AuthService from "@/services/AuthService.js";
import VCService from "@/services/VCService.js";

// Store
import { useUserStore } from "@/store/userStore";
import { mapStores } from "pinia";

export default {
  name: "AdminSettings",
  data() {
    return {
      newRootTao: "",
      newMapKey: "",
      newMapValue: "",
      loading: false,
      alertColor: "info",
      alert: false,
      alertMessage: "",
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
    };
  },
  methods: {
    /**
     * Creates a new mapping between VC Types.
     * Calls VCService to add the key-value mapping.
     * Shows success or error alerts and manages loading state.
     *
     * @param {string} key - The VC type you want to issue.
     * @param {string} value - The VC type you need to be able to issue it.
     * @returns {Promise<void>}
     */
    async createMapping(key, value) {
      try {
        this.loading = true;
        await VCService.createMapping(key, value);
        this.newMapKey = "";
        this.newMapValue = "";
        this.loading = false;
        this.alertMessage = `Succesfully added mapping ${key} : ${value}`;
        this.alert = true;
        this.alertColor = "success";
        setTimeout(() => {
          this.resetAlerts();
        }, 5000);
      } catch (error) {
        this.alertMessage = "There was an error, try again!";
        this.alert = true;
        this.alertColor = "error";
        setTimeout(() => {
          this.resetAlerts();
        }, 5000);
      }
    },

    /**
     * Sets a new root TAO.
     * Shows success or error alerts.
     *
     * @param {string} newRoot - The new root TAO DID.
     * @returns {Promise<void>}
     */
    async setRootTAO(newRoot) {
      try {
        await VCService.setRootTAO(newRoot);
        this.alertMessage = `Successfully added root ${newRoot}`;
        this.alert = true;
        this.alertColor = "success";
        setTimeout(() => {
          this.resetAlerts();
        }, 5000);
      } catch (error) {
        this.alertMessage = "There was an error, try again!";
        this.alert = true;
        this.alertColor = "error";
        setTimeout(() => {
          this.resetAlerts();
        }, 5000);
      }
    },

    /**
     * Resets the alert state and clears alert messages and color.
     */
    resetAlerts() {
      this.alert = false;
      this.alertMessage = "";
      this.alertColor = "info";
    },

    /**
     * Redirects the user to the Keycloak admin interface.
     */
    goToKeycloak() {
      window.location.href = "http://localhost:9090";
    },
  },
  computed: {
    ...mapStores(useUserStore),
  },
  mounted() {
    console.log("AdminPage mounted!");
  },
};
</script>

<style lang="css" scoped></style>
