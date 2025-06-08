<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center" max-width="800">
    <!-- Welcome message -->
    <div>
      <div class="mb-8 text-center">
        <div class="text-body-1 font-weight-light mb-n1">Welcome to</div>
        <h1 class="text-h2 font-weight-bold">Your DIDs</h1>
      </div>
    </div>

    <WalletManager v-slot="{ wallet, ready }">
      <template v-if="ready">
        <div style="display: none">
          {{ refreshDIDs(wallet) }}
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
                    <v-btn v-bind="activatorProps" variant="outlined" @click="dialogOpen = true">
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
                        <v-btn variant="outlined" class="ma-2s" @click="isActive.value = false">
                          Cancel
                          <v-icon icon="mdi-cancel" end></v-icon>
                        </v-btn>

                        <v-spacer></v-spacer>

                        <v-btn class="ma-2" variant="outlined" @click="createDID(wallet)">
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
                <div v-if="emptyDIDList" class="text-body-1 font-weight-light mb-n1">
                  There are no DIDs yet. You can create one by click the button above
                </div>

                <v-card v-else v-for="DID in DIDs" :key="DID.did" class="mb-4 mt-4">
                  <template v-slot:title>
                    <span class="font-weight-black">{{ DID.name }}</span>
                  </template>

                  <v-card-subtitle class="text-body-1 font-weight-light mb-4">
                    {{ DID.did }}
                  </v-card-subtitle>

                  <!-- Delete DID -->
                  <template v-slot:append>
                    <v-dialog v-model="deleteDIDDialog" max-width="500">
                      <!-- Activator button -->
                      <template v-slot:activator="{ props: deleteButton }">
                        <v-btn
                          v-bind="deleteButton"
                          variant="outlined"
                          @click="
                            () => {
                              (deleteDIDDialog = true), (DIDToDelete = DID.did);
                            }
                          "
                        >
                          Delete DID <v-icon icon="mdi-file-document-remove-outline" end></v-icon
                        ></v-btn>
                      </template>

                      <!-- Dialog -->
                      <template v-slot:default="{ isActive }">
                        <v-card title="Are you sure you want to delete this DID?">
                          <v-card-actions>
                            <v-btn class="ma-2s" variant="outlined" @click="isActive.value = false">
                              No
                              <v-icon icon="mdi-cancel" end></v-icon>
                            </v-btn>

                            <v-spacer></v-spacer>

                            <v-btn
                              class="ma-2"
                              variant="outlined"
                              @click="deleteDID(DIDToDelete, wallet)"
                            >
                              Yes
                              <v-icon icon="mdi-checkbox-marked-circle" end></v-icon>
                            </v-btn>
                          </v-card-actions>
                        </v-card>
                      </template>
                    </v-dialog>
                  </template>

                  <v-card-actions>
                    <v-btn class="ma-2" variant="outlined" @click="getDIDDocument(DID.did)">
                      <span v-if="showHideToggle[DID.did]">Hide document</span>
                      <span v-else>Show DID document</span>
                    </v-btn>
                  </v-card-actions>
                  <v-card class="mb-4 mt-4" color="grey-lighten-1">
                    <pre
                      v-if="didDoc[DID.did]"
                      class="text-body-1 font-weight-light mb-n1"
                      style="white-space: pre-wrap; word-break: break-word; padding: 0 16px"
                    >
                      {{ JSON.stringify(didDoc[DID.did], null, 2) }}
                      <!-- Edit DID -->
                      <v-dialog v-model="editDIDDocDialog" max-width="500">
                        <template v-slot:activator="{ props: editButton }">
                          <v-btn
                              v-bind="editButton"
                              class="position-absolute bottom-0 right-0 ma-2"
                              variant="outlined"
                              @click="editDIDDocDialog = true"
                          >
                          Edit document
                            <v-icon icon="mdi-file-document-edit-outline" end></v-icon>
                          </v-btn>
                        </template>
                          <template v-slot:default="{ isActive }">
                            <v-card title="Document edit">
                                <v-card-text >
                                  Edit controller
                                  <v-form v-model="valid">
                                    <v-text-field
                                        v-model="newControllerName"
                                        label="Controller DID"
                                        required
                                        :rules="didStructureRules"
                                    ></v-text-field>
                                    <div class="d-flex justify-end">
                                      <v-btn
                                          class="ma-2 mt-n4"
                                          variant="outlined"
                                          :disabled="!valid"
                                          @click="modifyController(DID.did,'addController')">
                                        Add
                                        <v-icon icon="mdi-plus-circle" end></v-icon>
                                      </v-btn>
                                    </div>
                                      <v-alert
                                          v-if="editControllerAlert"
                                          :color = "alertColor"
                                      >
                                          {{editControllerMessage}}
                                      </v-alert>
                                  </v-form>

                                </v-card-text>


                            <v-card-actions>
                              <v-btn
                                  class="ma-2s"
                                  variant="outlined"
                                  @click="() => {isActive.value = false; newControllerName=''}"
                              >
                                Cancel
                                <v-icon icon="mdi-cancel" end></v-icon>
                              </v-btn>

                              <v-spacer></v-spacer>

                              <v-btn class="ma-2" variant="outlined" @click="isActive.value = false">
                                Done
                                <v-icon icon="mdi-checkbox-marked-circle" end></v-icon>
                              </v-btn>
                            </v-card-actions>
                          </v-card>
                        </template>
                      </v-dialog>
                    </pre>
                  </v-card>
                </v-card>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </WalletManager>
  </v-container>
</template>

<script lang="js">
/* ----------------------- IMPORTS ----------------------- */
import DIDService from "@/services/DIDService";
import WalletManager from "@/components/wallet/WalletManager.vue";

/* ----------------------- CONFIG ----------------------- */
export default {
  name: "DIDsPage",
  components: { WalletManager },
  data() {
    return {
      DIDs: [],

      // Dialog state
      dialogOpen: false,
      deleteDIDDialog: false,
      DIDToDelete: null,
      editDIDDocDialog: false,
      editControllerAlert: false,
      editControllerMessage: "",
      alertColor: "info",
      valid: false,
      newDIDname: "",
      newControllerName: "",
      showHideToggle: {},
      didDoc: {},
      didList: true,
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
      DIDNameRules: [
        (value) => {
          if (value) return true;

          return "Name is required.";
        },
        (value) => {
          if (value?.length <= 20) return true;

          return "Name must be less than 20 characters.";
        },
      ],
    };
  },
  methods: {
    // Method to handle the creation of a new DID
    async createDID(wallet) {
      if (this.valid) {
        // 0. Create keys
        const { publicKey, privateKey } = await this.generateKeys(); //still needs to handle private key
        const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
        const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKey)));

        // 1. Send to backend

        const PEMPublicKey = await this.formatPEM(publicKey);
        const res = await DIDService.createDID(PEMPublicKey);
        console.log(res.data);

        // 2. Store in the wallet
        wallet.addDid(
          res.data,
          {
            publicKeyBase64,
            privateKeyBase64,
          },
          this.newDIDname
        );

        // 3. Persist the wallet
        await wallet.save();

        // 4. Add to the list
        this.refreshDIDs(wallet);

        // 5. Reset the form
        this.newDIDname = "";
        this.valid = false;

        // 6. Close the dialog
        this.dialogOpen = false;
      }
    },

    async generateKeys() {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        true, //used for being able to export the key
        ["sign", "verify"]
      );
      //both are arrayBuffers:
      const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey); //with exportKey not encrypted, use SubtleCrypto.wrapKey() for encryption
      const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey); //maybe let the user encrypt

      return { publicKey, privateKey };
    },

    async formatPEM(key) {
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(key)));
      return `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;
    },

    async getDIDDocument(DID) {
      if (this.showHideToggle[DID]) {
        this.showHideToggle[DID] = false;
        this.didDoc[DID] = null;
        return;
      }
      // 1. Send to backend
      const res = await DIDService.getDIDDoc(DID);
      this.showHideToggle[DID] = true;
      this.didDoc[DID] = res.data;
      console.log(res.data);
    },

    async deleteDID(DID, wallet) {
      try {
        await DIDService.deleteDID(DID);
      } catch (error) {
        // Check if the error is given by DID missing in the blockchain
        const reason = error?.response?.data?.reason || "";

        // If it is, simply proceed
        if (reason === "DID_NOT_FOUND") {
          console.warn("DID already deleted. Proceeding to remove locally.");
        } else {
          // Otherwise throw a generic error
          console.error("Unexpected error deleting DID:", error);
          return;
        }
      }

      // Delete from the wallet
      wallet.removeDid(DID);

      // Persist the wallet
      await wallet.save();
      this.refreshDIDs(wallet);
      this.deleteDIDDialog = false;
      this.DIDToDelete = null;
    },

    async modifyController(DID, operation) {
      try {
        await DIDService.modifyController(DID, operation, this.newControllerName);
        this.editControllerMessage = `Successfully added controller: ${this.newControllerName}`;
        this.newControllerName = "";
        const res = await DIDService.getDIDDoc(DID);
        this.didDoc[DID] = res.data;
        this.editControllerAlert = true;
        this.alertColor = "success";
        setTimeout(() => {
          this.resetAlerts();
        }, 3000);
      } catch (err) {
        this.editControllerAlert = true;
        this.editControllerMessage = "There was a problem when adding the controller. Try again.";
        this.alertColor = "error";
        setTimeout(() => {
          this.resetAlerts();
        }, 3000);
      }
    },

    resetAlerts() {
      this.editControllerAlert = false;
      this.editControllerMessage = "";
      this.alertColor = "info";
    },

    refreshDIDs(wallet) {
      // Fill the page with the DIDs loaded from the wallet
      if (!wallet || !wallet.dids) {
        return;
      }
      this.DIDs = Object.entries(wallet.dids).map(([did, data]) => ({
        did,
        name: data.metadata?.name || "Unnamed DID",
      }));
    },
  },
  computed: {
    emptyDIDList() {
      return this.DIDs.length === 0;
    },
    // Computed properties can be added here if needed
  },
  async mounted() {
    console.log("DIDsPage mounted");
  },
};
</script>

<style lang="css" scoped></style>
