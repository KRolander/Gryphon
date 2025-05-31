<template>
  <v-container
    class="fill-height d-flex flex-column align-center justify-center"
    max-width="600"
  >
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
              <!-- EMAIL FIELD -->
              <v-text-field
                class="mb-4 mt-4"
                label="E-mail"
                type="email"
                v-model="email"
                :rules="emailRules"
                :error="emailHasCustomError"
                :error-messages="
                  emailHasCustomError ? emailCustomErrorMessage : ''
                "
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
            <v-btn
              color="primary"
              size="large"
              variant="outlined"
              class="font-weight-bold"
              @click="login"
              :disabled="loading"
            >
              <span v-if="!loading">Login</span>
              <v-progress-circular
                v-else
                color="primary"
                indeterminate
              ></v-progress-circular>
            </v-btn>

            <span class="font-weight-light"
              >Don't have an account yet? Signup
              <router-link
                :to="{ name: 'signup' }"
                class="text-decoration-none text-primary"
              >
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
      emailRules: [
        (v) => !!v || "E-mail is required",
        (v) =>
          /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(
            v
          ) || "E-mail must be valid",
      ],

      passwordRules: [(v) => !!v || "Password is required"],
    };
  },
  methods: {
    login() {
      if (this.valid) {
        // Log successful message
        console.log("Login form submitted");

        // Send request to the backend
        this.loading = true;

        // Magic will happen here, e.g., API call
      } else {
        console.log("Form is invalid");
      }
    },
  },
};
</script>

<style lang="css" scoped></style>
