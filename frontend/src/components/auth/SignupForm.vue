<template>
  <v-container
    class="fill-height d-flex flex-column align-center justify-center"
    max-width="600"
  >
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
            <v-form>
              <!-- USERNAME FIELD -->
              <v-text-field label="Username" required></v-text-field>

              <!-- EMAIL FIELD -->
              <v-text-field label="E-mail" type="email" required></v-text-field>

              <!-- PASSWORD FIELD -->
              <v-text-field
                label="Password"
                type="password"
                required
              ></v-text-field>

              <!-- CONFIRM PASSWORD FIELD -->
              <v-text-field
                label="Confirm Password"
                type="password"
                required
              ></v-text-field>
            </v-form>
          </v-card-text>

          <!-- ==================== ACTIONS ==================== -->
          <v-card-actions class="d-flex flex-column justify-center">
            <!-- <v-spacer></v-spacer> -->
            <v-btn color="primary" variant="outlined" class="font-weight-bold">
              Sign Up
            </v-btn>

            <span class="font-weight-light"
              >Already have an account? Login
              <router-link
                :to="{ name: 'login' }"
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

<script></script>

<style lang="css" scoped></style>
