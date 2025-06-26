<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center" max-width="600">
    <!-- Welcome message -->
    <div>
      <div class="mb-8 text-center">
        <div class="text-body-1 font-weight-light mb-n1">Welcome to</div>
        <h1 class="text-h2 font-weight-bold">The Login Page</h1>
      </div>
    </div>

    <!-- ==================== FORM ==================== -->
    <v-row class="w-100">
      <v-col cols="12">
        <v-card>
          <!-- ==================== TITLE ==================== -->
          <v-card-title class="font-weight-bold"> Login </v-card-title>

          <!-- ==================== FIELDS ==================== -->
          <v-card-text>
            <v-form v-model="valid" @submit.prevent="login">
              <!-- USERNAME FIELD -->
              <v-text-field
                class="mb-4 mt-4"
                label="Username"
                v-model="username"
                :rules="usernameRules"
                required
              ></v-text-field>

              <!-- PASSWORD FIELD -->
              <v-text-field
                class="mb-4 mt-4"
                label="Password"
                type="password"
                v-model="password"
                :rules="passwordRules"
                required
              ></v-text-field>
            </v-form>
          </v-card-text>

          <!-- ==================== ACTIONS ==================== -->
          <v-card-actions class="d-flex flex-column justify-center">
            <!-- <v-spacer></v-spacer> -->
            <div class="d-flex justify-center ga-8">
              <v-btn
                color="primary"
                size="large"
                variant="outlined"
                class="font-weight-bold"
                @click="login"
                :disabled="loading"
              >
                <span v-if="!loading">Login</span>
                <v-progress-circular v-else color="primary" indeterminate></v-progress-circular>
              </v-btn>
            </div>

            <span class="font-weight-light"
              >Don't have an account yet? Signup
              <router-link :to="{ name: 'signup' }" class="text-decoration-none text-primary">
                here</router-link
              ></span
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/* ======================= IMPORTS ======================= */
// Auth
import AuthService from "@/services/AuthService";

// Store
import { useUserStore } from "@/store/userStore";
import { mapStores } from "pinia";

/* ======================= CONFIG ======================= */
export default {
  name: "LoginForm",
  data() {
    return {
      valid: false,
      loading: false,
      /* --------------------- FIELD VALUES --------------------- */
      email: "",
      emailHasCustomError: false,
      emailCustomErrorMessage: "",

      password: "",

      /* --------------------- RULES --------------------- */
      username: "",
      usernameRules: [(v) => !!v || "Username is required"],

      passwordRules: [(v) => !!v || "Password is required"],
    };
  },
  computed: {
    ...mapStores(useUserStore),
  },
  methods: {
    /**
     * Submits the login form by sending credentials to the backend.
     *
     * Handles UI state (e.g., loading), stores user and token info upon success,
     * and redirects based on user role. Also manages basic validation.
     *
     * @returns {Promise<void>}
     **/
    async login() {
      //TODO to modify so it recognizes admin maybe from the jwt
      if (this.valid) {
        // Send request to the backend
        this.loading = true;

        // Send signup request to be backend service
        const res = await AuthService.login({
          username: this.username,
          password: this.password,
        });

        // Finish
        this.loading = false;

        // Check if the response contains an access token
        if (!res.data || !res.data.access_token) {
          // TODO: Add more meaningful error handling
          return;
        }

        // Check if the user has the admin rolr or not
        const roles = res.data.user.resource_access
          ? res.data.user.resource_access["admin-cli"].roles
          : null;

        // Store the token inside the local storage
        localStorage.setItem("access_token", res.data.access_token);
        // Store the user data in the Pinia store
        await this.userStore.setUser({
          id: res.data.user.sub,
          username: res.data.user.preferred_username,
          email: res.data.user.email,
          roles: roles,
        });

        // Redirect to the home page
        //TODO redirect based on wether admin or not
        //if (admin){
        this.$router.push({ name: "admin" });
        // }
        //this.$router.push({ name: "home" });
      } else {
        console.log("Form is invalid");
      }
    },
  },
};
</script>

<style lang="css" scoped></style>
