<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center" max-width="600">
    <!-- ====================  WELCOME ==================== -->
    <div>
      <div class="mb-8 text-center">
        <div class="text-body-1 font-weight-light mb-n1">Welcome to</div>
        <h1 class="text-h2 font-weight-bold">The Signup Page</h1>
      </div>
    </div>

    <!-- ==================== FORM ==================== -->
    <v-row class="w-100">
      <v-col cols="12">
        <v-card>
          <!-- ==================== TITLE ==================== -->
          <v-card-title class="font-weight-bold"> Signup </v-card-title>

          <!-- ==================== FIELDS ==================== -->
          <v-card-text>
            <v-form v-model="valid" @submit.prevent="signup">
              <!-- USERNAME FIELD -->
              <v-text-field
                ref="usernameField"
                class="mb-4 mt-4"
                label="Username"
                :model-value="modelValueUsername"
                @update:model-value="(val) => (modelValueUsername = val)"
                :rules="usernameRules"
                :counter="20"
                required
              ></v-text-field>

              <!-- EMAIL FIELD -->
              <v-text-field
                ref="emailField"
                class="mb-4 mt-4"
                label="E-mail"
                type="email"
                :model-value="modelValueEmail"
                @update:model-value="(val) => (modelValueEmail = val)"
                :rules="emailRules"
                :error="emailHasCustomError"
                :error-messages="emailHasCustomError ? emailCustomErrorMessage : ''"
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

              <!-- CONFIRM PASSWORD FIELD -->
              <v-text-field
                class="mb-4 mt-4"
                label="Confirm Password"
                type="password"
                v-model="confirmPassword"
                :rules="confirmPasswordRules"
                required
              ></v-text-field>
            </v-form>
          </v-card-text>

          <!-- ==================== ACTIONS ==================== -->
          <v-card-actions class="d-flex flex-column justify-center">
            <!-- <v-spacer></v-spacer> -->
            <v-btn
              color="primary"
              size="large"
              variant="outlined"
              class="font-weight-bold"
              @click="signup"
              :disabled="loading"
            >
              <span v-if="!loading">Sign Up</span>
              <v-progress-circular v-else color="primary" indeterminate></v-progress-circular>
            </v-btn>

            <span class="font-weight-light"
              >Already have an account? Login
              <router-link :to="{ name: 'login' }" class="text-decoration-none text-primary">
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
import { mapStores } from "pinia";
import { useUserStore } from "@/store/userStore.js";

/* ======================= CONFIG ======================= */
export default {
  name: "SignupForm",
  props: {
    username: {
      type: String,
      default: undefined, // If this prop is defined, it means that this runs in a testing env
    },
    email: {
      type: String,
      default: undefined,
    },
  },
  emits: ["update:username", "update:email"],
  data() {
    return {
      valid: false,
      loading: false,
      /* --------------------- FIELD VALUES --------------------- */
      /* USERNAME */
      internalUsername: "",

      /* -------- */
      internalEmail: "",
      emailHasCustomError: false,
      emailCustomErrorMessage: "",

      password: "",
      confirmPassword: "",

      /* --------------------- RULES --------------------- */
      usernameRules: [
        (v) => !!v || "Username is required",
        (v) => (v && v.length >= 3) || "Username must be at least 3 characters",
        (v) => (v && v.length <= 20) || "Username must be at most 20 characters",
      ],

      emailRules: [
        (v) => !!v || "E-mail is required",
        (v) =>
          /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(
            v
          ) || "E-mail must be valid",
      ],

      passwordRules: [
        (v) => !!v || "Password is required",
        (v) => (v && v.length >= 6) || "Password must be at least 6 characters",
        (v) => (v && v.length <= 20) || "Password must be at most 20 characters",
      ],

      confirmPasswordRules: [
        (v) => !!v || "Confirm Password is required",
        (v) => v === this.password || "Passwords do not match",
      ],
    };
  },
  computed: {
    ...mapStores(useUserStore),

    /* --------------------- USERNAME --------------------- */
    modelValueUsername: {
      /**
       * Defines the behaviour of the computer property when its value is requested.
       * If the username prop is defined, it means that this runs in a testing env
       * If the username prop is not defined, it means that this runs in the browser
       * and the internalUsername is used to store the value.
       * @returns {string} The chosen username value
       */
      get() {
        return this.username !== undefined ? this.username : this.internalUsername;
      },

      /**
       * Defines the behaviour of the computer property when its value is set.
       * If the username prop is defined, it means that this runs in a testing env
       * If the username prop is not defined, it means that this runs in the browser
       * and the internalUsername is used to store the value.
       */
      set(val) {
        if (this.username !== undefined) {
          this.$emit("update:username", val);
        } else {
          this.internalUsername = val;
        }
      },
    },

    /* --------------------- EMAIL --------------------- */
    modelValueEmail: {
      /**
       * Defines the behaviour of the computer property when its value is requested.
       * If the email prop is defined, it means that this runs in a testing env
       * If the email prop is not defined, it means that this runs in the browser
       * and the internalEmail is used to store the value.
       * @returns {string} The chosen email value
       */
      get() {
        return this.email !== undefined ? this.email : this.internalEmail;
      },

      /**
       * Defines the behaviour of the computer property when its value is set.
       * If the email prop is defined, it means that this runs in a testing env
       * If the email prop is not defined, it means that this runs in the browser
       * and the internalEmail is used to store the value.
       */
      set(val) {
        if (this.email !== undefined) {
          this.$emit("update:email", val);
        } else {
          this.internalEmail = val;
        }
      },
    },
  },
  methods: {
    async signup() {
      console.log(this.internalUsername);
      console.log(this.internalEmail);
      return;

      // Ensire that the form is valid upoon submission
      if (this.valid) {
        // Disable the signup button
        this.loading = true;

        // Send signup request to be backend service
        const res = await AuthService.signup({
          username: this.internalUsername,
          email: this.internalEmail,
          password: this.password,
        });

        // Finish
        this.loading = false;

        // Check if the response contains an access token
        if (!res.data || !res.data.access_token) {
          // TODO: Add more meaningful error handling
          return;
        }

        // Store the token inside the local storage
        localStorage.setItem("access_token", res.data.access_token);

        // Store the user data in the Pinia store
        await this.userStore.setUser({
          id: res.data.user.sub,
          username: res.data.user.preferred_username,
          email: res.data.user.email,
        });

        // Redirect to the home page
        this.$router.push({ name: "home" });
      } else {
        console.log("Form is invalid");
      }
    },
  },
};
</script>

<style lang="css" scoped></style>
