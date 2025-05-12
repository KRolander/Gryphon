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
            <v-btn>Add <v-icon icon="mdi-plus-circle" end></v-icon></v-btn>
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
      DIDs: [{ name: "DID1", did: "did:ssi:asofsabnfoasfboisn" }, { name: "DID2", did: "did:ssi:asofsabnfoasfbasdasd" }],
    };
  },
  computed: {
    emptyDIDList() {
      return this.DIDs.length === 0;
    },
    // Computed properties can be added here if needed
  },
};
</script>

<style lang="css" scoped></style>
