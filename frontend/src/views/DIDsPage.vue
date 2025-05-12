<template>
  <v-container
    class="fill-height d-flex flex-column align-center justify-center"
    max-width="800"
  >
    <!-- Welcome message -->
    <div>
      <div class="mb-8 text-center">
        <div class="text-body-1 font-weight-light mb-n1">Welcome to</div>
        <h1 class="text-h2 font-weight-bold">Your DIDs</h1>
      </div>
    </div>

    <!-- Card containing DIDs -->
    <v-row class="w-100">
      <v-col cols="12">
        <v-card class="mx-auto">
          <!-- Card title -->
          <template v-slot:title>
            <span class="font-weight-black">Your DIDs</span>
          </template>

          <!-- Add button together with icon -->
          <template v-slot:append>
            <v-dialog v-model="dialogOpen" max-width="500">
              <!-- Activator button -->
              <template v-slot:activator="{ props: activatorProps }">
                <v-btn
                  v-bind="activatorProps"
                  variant="flat"
                  @click="dialogOpen = true"
                >
                  Add <v-icon icon="mdi-plus-circle" end></v-icon
                ></v-btn>
              </template>

              <!-- Dialog -->
              <template v-slot:default="{ isActive }">
                <v-card title="Create DID">
                  <v-card-text>
                    <v-form v-model="valid" @submit.prevent="createDID">
                      <v-text-field
                        v-model="newDIDname"
                        :counter="20"
                        :rules="DIDNameRules"
                        label="Name"
                        required
                      ></v-text-field>
                    </v-form>
                  </v-card-text>

                  <v-card-actions>
                    <v-btn
                      text="Close"
                      class="ma-2s"
                      @click="isActive.value = false"
                    ></v-btn>

                    <v-spacer></v-spacer>

                    <v-btn class="ma-2" variant="outlined" @click="createDID()">
                      Create
                      <v-icon icon="mdi-checkbox-marked-circle" end></v-icon>
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </template>
            </v-dialog>
          </template>

          <!-- Card content -->
          <v-card-text class="bg-surface-light pt-4">
            <div
              v-if="emptyDIDList"
              class="text-body-1 font-weight-light mb-n1"
            >
              There are no DIDs yet. You can create one by click the button
              above
            </div>
            <v-card v-else v-for="DID in DIDs" :key="DID.did" class="mb-4 mt-4">
              <v-card-title class="text-h5 font-weight-bold">{{
                DID.name
              }}</v-card-title>

              <v-card-subtitle class="text-body-1 font-weight-light mb-4">
                {{ DID.did }}
              </v-card-subtitle>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="js">
export default {
  name: "DIDsPage",
  data() {
    return {
      DIDs: [],

      // Dialog state
      dialogOpen: false,
      valid: false,
      newDIDname: "",
      DIDNameRules: [
        value => {
          if (value) return true

          return 'Name is required.'
        },
        value => {
          if (value?.length <= 20) return true

          return 'Name must be less than 10 characters.'
        },
      ],
    }
  },
  methods: {
    // Method to handle the creation of a new DID
    createDID() {
      if (this.valid) {
        // 1. Send to backend
        // to be added very soon hopefully

        // 2. Add to the list
        this.DIDs.push({ name: this.newDIDname, did: "did:ssi:" + this.newDIDname });

        // 3. Reset the form
        this.newDIDname = "";
        this.valid = false;

        // 4. Close the dialog
        this.dialogOpen = false;
      }
    },
  },
  computed: {
    emptyDIDList() {
      return this.DIDs.length === 0;
    },
    // Computed properties can be added here if needed
  },
  mounted() {
    console.log("DIDsPage mounted");
    // Fetch the DIDs from the backend when the component is mounted
    // to be added very soon hopefully
  },
};
</script>

<style lang="css" scoped></style>
