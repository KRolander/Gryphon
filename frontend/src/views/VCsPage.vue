<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center" max-width="800">
    <div>
      <div class="mb-8 text-center">
        <div class="text-body-1 font-weight-light mb-n1">Welcome to</div>
        <h1 class="text-h2 font-weight-bold">Your VCs</h1>
      </div>
    </div>

    <WalletManager v-slot="{ wallet, ready }">
      <template v-if="ready">
        <!-- Run setup functions -->
        <template style="display: none">
          <!-- Initialize the VCs from the wallet -->
          {{ refreshVCs(wallet) }}

          <!-- Make the object that keeps track of shown VCs -->
          {{ initShowVCs() }}
        </template>

        <!-- Card for the VCs sorted by DID -->
        <v-row class="w-100">
          <v-col cols="12">
            <v-card class="mb-4 mt-4">
              <!-- Card Title -->
              <template v-slot:title>
                <span class="font-weight-black">Your VCs</span>
              </template>

              <!-- Interaction with other VCs -->
              <template v-slot:append>
                <!-- Button to verify a VC -->
                <v-dialog v-model="verifyVCDialog" max-width="500">
                  <!-- Activator button -->
                  <template v-slot:activator="{ props: verifyButton }">
                    <v-btn v-bind="verifyButton" variant="outlined" @click="verifyVCDialog = true">
                      Verify <v-icon icon="mdi-checkbox-marked-circle" end />
                    </v-btn>
                  </template>

                  <!-- Dialog -->
                  <template v-slot:default="{ isActive }">
                    <v-card title="Verify a VC">
                      <v-card-text>
                        <v-text-field label="VC To Verify" v-model="VCToVerify" required />

                        <!-- Alert to show info to the user -->
                        <v-alert v-if="verifyVCAlert" :color="verifyVCAlertColor">
                          {{ verifyVCMessage }}
                        </v-alert>
                      </v-card-text>
                      <v-card-actions>
                        <v-btn class="ma-2s" variant="outlined" @click="isActive.value = false">
                          Cancel <v-icon icon="mdi-cancel" end />
                        </v-btn>

                        <v-spacer />

                        <v-btn class="ma-2" variant="outlined" @click="handleVerifyVC()">
                          Verify <v-icon icon="mdi-checkbox-marked-circle" end />
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </template>
                </v-dialog>

                <!-- Button to issue VCs -->
                <v-dialog v-model="issueVCDialog" max-width="500">
                  <!-- Activator button -->
                  <template v-slot:activator="{ props: issueButtonProps }">
                    <v-btn
                      v-bind="issueButtonProps"
                      variant="outlined"
                      @click="issueVCDialog = true"
                    >
                      Issue <v-icon icon="mdi-file-document-plus" end />
                    </v-btn>
                  </template>

                  <!-- Dialog -->
                  <template v-slot:default="{ isActive }">
                    <v-card title="Issue VC">
                      <v-card-text>
                        <v-form v-model="issueVCValid" @submit.prevent="(e) => issueVC(wallet)">
                          <v-text-field
                            label="VC Name"
                            v-model="issueVCFormData.name"
                            :counter="20"
                            :rules="nameRules"
                            required
                          />

                          <v-select
                            label="Issuer DID"
                            v-model="issueVCFormData.issuer"
                            :items="VCs"
                            item-title="name"
                            return-object
                            required
                          />

                          <v-text-field
                            label="Subject DID"
                            v-model="issueVCFormData.subject"
                            :rules="didStructureRules"
                            required
                          />

                          <v-select
                            label="VC Type"
                            v-model="issueVCFormData.type"
                            :items="getIssuableVCTypes(wallet, this.issueVCFormData.issuer)"
                            :rules="[(type) => !!type || 'Type is required']"
                            required
                          />

                          <template v-for="(claim, index) in issueVCFormData.claims" :key="index">
                            <v-row>
                              <v-col cols="5">
                                <v-text-field
                                  v-model="claim.key"
                                  label="Claim Key"
                                  :rules="[(key) => !!key || 'Claim Key is required']"
                                  required
                                />
                              </v-col>
                              <v-col cols="5">
                                <v-text-field
                                  v-model="claim.val"
                                  label="Claim Value"
                                  :rules="[(val) => !!val || 'Claim Value is required']"
                                  required
                                />
                              </v-col>
                              <v-col cols="2" class="d-flex align-center">
                                <v-btn icon @click="this.issueVCFormData.claims.splice(index, 1)">
                                  <v-icon>mdi-delete</v-icon>
                                </v-btn>
                              </v-col>
                            </v-row>
                          </template>

                          <v-btn
                            variant="outlined"
                            @click="this.issueVCFormData.claims.push({ key: '', val: '' })"
                          >
                            Add Claim
                          </v-btn>
                        </v-form>
                      </v-card-text>

                      <v-card-actions>
                        <v-btn
                          class="ma-2s"
                          variant="outlined"
                          @click="
                            () => {
                              resetIssueVCForm();
                              isActive.value = false;
                            }
                          "
                        >
                          Cancel
                          <v-icon icon="mdi-cancel" end />
                        </v-btn>

                        <v-spacer />

                        <v-btn
                          class="ma-2"
                          variant="outlined"
                          :disabled="!issueVCValid"
                          @click="issueVC(wallet)"
                        >
                          Issue
                          <v-icon icon="mdi-checkbox-marked-circle" end />
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </template>
                </v-dialog>

                <!-- Popup to show the resulting Issued VC -->
                <v-dialog v-model="issuedVCPopup" max-width="800">
                  <template v-slot:default="{ isActive }">
                    <v-card title="Your VC">
                      <v-card class="mb-4 mt-4" color="grey-lighten-1">
                        <v-card-text>
                          <pre
                            class="text-body-1 font-weight-light mb-n1"
                            style="white-space: pre-wrap; word-break: break-word; padding: 0 16px"
                          >
                            {{ this.issuedVC }}
                          </pre>
                        </v-card-text>
                      </v-card>

                      <v-card-actions>
                        <!-- Close button -->
                        <v-btn variant="outlined" class="ma-2s" @click="isActive.value = false">
                          Close <v-icon icon="mdi-close-thick" />
                        </v-btn>

                        <v-spacer />

                        <!-- Add to clipboard button -->
                        <v-btn
                          variant="outlined"
                          class="ma-2s"
                          @click="this.handleAddToClipboard()"
                        >
                          Add to Clipboard <v-icon icon="mdi-clipboard" />
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </template>
                </v-dialog>
              </template>

              <!-- Card content -->
              <v-card-text class="bg-surface-light pt-4">
                <div v-if="this.VCs.length === 0" class="text-body-1 font-weight-light mb-n1">
                  There are no DIDs yet. You can create one in the DID page
                </div>

                <template v-else>
                  <v-card v-for="(VCList, index) in VCs" :key="VCList.did" class="mb-4 mt-4">
                    <template v-slot:title>
                      <span class="font-weight-black">{{ VCList.name }}</span>
                    </template>

                    <v-card-subtitle class="text-body-1 font-weight-light mb-4">
                      {{ VCList.did }}
                    </v-card-subtitle>

                    <template v-slot:append>
                      <!-- Add VC Button and pop up -->
                      <v-dialog v-model="addVCDialog" max-width="500">
                        <!-- Activator button -->
                        <template v-slot:activator="{ props: activatorProps }">
                          <v-btn
                            v-bind="activatorProps"
                            variant="outlined"
                            @click="
                              addVCDid = VCList.did;
                              addVCDialog = true;
                            "
                          >
                            Add <v-icon icon="mdi-plus-circle" end></v-icon
                          ></v-btn>
                        </template>

                        <!-- Dialog -->
                        <template v-slot:default="{ isActive }">
                          <v-card title="Add a VC">
                            <v-card-text>
                              <v-form
                                v-model="addVCValid"
                                @submit.prevent="(e) => handleAddVC(wallet)"
                              >
                                <v-text-field
                                  v-model="addedVCName"
                                  :counter="20"
                                  :rules="nameRules"
                                  label="Name"
                                  required
                                />
                                <v-text-field
                                  v-model="addedVCBody"
                                  :rules="[(body) => !!body || 'Body is Required']"
                                  label="VC To Add"
                                  required
                                />
                              </v-form>
                            </v-card-text>

                            <v-card-actions>
                              <v-btn
                                variant="outlined"
                                class="ma-2s"
                                @click="isActive.value = false"
                              >
                                Cancel
                                <v-icon icon="mdi-cancel" end />
                              </v-btn>

                              <v-spacer />

                              <v-btn
                                class="ma-2"
                                variant="outlined"
                                :disabled="!addVCValid"
                                @click="handleAddVC(wallet)"
                              >
                                Add
                                <v-icon icon="mdi-checkbox-marked-circle" end />
                              </v-btn>
                            </v-card-actions>
                          </v-card>
                        </template>
                      </v-dialog>
                      <v-btn
                        class="ma-2"
                        variant="outlined"
                        @click="showVCs[VCList.did].displayed = !showVCs[VCList.did].displayed"
                      >
                        <span v-if="showVCs[VCList.did].displayed">Hide VCs</span>
                        <span v-else>Show VCs</span>
                      </v-btn>
                    </template>

                    <v-card-text class="bg-surface-light pt-4">
                      <v-card class="mb-4 mt-4" color="grey-lighten-1">
                        <template
                          v-if="showVCs[VCList.did].displayed"
                          class="text-body-1 mb-n1"
                          style="white-space: pre-wrap; word-break: break-word; padding: 0 16px"
                        >
                          <div
                            v-if="emptyCredentials(wallet, index)"
                            class="text-body-1 font-weight-light mb-n1"
                          >
                            There are no VCs yet. You can add one with the button above
                          </div>
                          <template v-else>
                            <v-card v-for="(VC, name, index) in VCList.credentials" :key="index">
                              <template v-slot:title>
                                <span class="font-weight-black">{{ name }}</span>
                              </template>

                              <template v-slot:append>
                                <!-- Delete VC Dialog -->
                                <v-dialog v-model="deleteVCDialog" max-width="500">
                                  <!-- Activator button -->
                                  <template v-slot:activator="{ props: deleteButton }">
                                    <v-btn v-bind="deleteButton" variant="outlined">
                                      Delete VC
                                      <v-icon icon="mdi-file-document-remove-outline" end />
                                    </v-btn>
                                  </template>

                                  <!-- Dialog -->
                                  <template v-slot:default="{ isActive }">
                                    <v-card title="Are you sure you want to delete this VC?">
                                      <v-card-actions>
                                        <v-btn
                                          class="ma-2s"
                                          variant="outlined"
                                          @click="isActive.value = false"
                                        >
                                          Cancel <v-icon icon="mdi-cancel" end />
                                        </v-btn>

                                        <v-spacer />

                                        <v-btn
                                          class="ma-2"
                                          variant="outlined"
                                          @click="handleDeleteVC(wallet, VCList.did, name)"
                                        >
                                          Confirm <v-icon icon="mdi-checkbox-marked-circle" end />
                                        </v-btn>
                                      </v-card-actions>
                                    </v-card>
                                  </template>
                                </v-dialog>
                              </template>

                              <v-card-actions>
                                <v-btn
                                  class="ma-2"
                                  variant="outlined"
                                  @click="
                                    showVCs[VCList.did].creds[name] =
                                      !showVCs[VCList.did].creds[name]
                                  "
                                >
                                  <span v-if="showVCs[VCList.did].creds[name]">Hide VC</span>
                                  <span v-else>Show VC</span>
                                </v-btn>
                              </v-card-actions>

                              <v-card class="mb-4 mt-4" color="grey-lighten-1">
                                <pre
                                  v-if="showVCs[VCList.did].creds[name]"
                                  class="text-body-1 font-weight-light mb-n1"
                                  style="
                                    white-space: pre-wrap;
                                    word-break: break-word;
                                    padding: 0 16px;
                                  "
                                >
                                  {{ VC }}
                                </pre>
                              </v-card>
                            </v-card>
                          </template>
                        </template>
                      </v-card>
                    </v-card-text>
                  </v-card>
                </template>
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
import WalletManager from "@/components/wallet/WalletManager.vue";
import VCService from "@/services/VCService.js";
import { VCBuilder, UnsignedVCBuilder } from "@/../../utils/VC.ts";
import canonicalize from "canonicalize";
import { sign } from "@/utils/crypto";

/* ----------------------- CONFIG ----------------------- */
export default {
  name: "VCsPage",
  components: { WalletManager },
  data() {
    return {
      VCs: [],
      showVCs: null,
      verifyVCDialog: false,
      verifyVCAlert: false,
      verifyVCAlertColor: "info",
      verifyVCMessage: "",
      VCToVerify: "",
      issueVCDialog: false,
      issueVCValid: false,
      issueVCFormData: {
        name: "",
        type: "",
        issuer: null,
        subject: "",
        claims: [],
      },
      nameRules: [
        (value) => {
          if (value) return true;

          return "Name is required.";
        },
        (value) => {
          if (value?.length <= 20) return true;

          return "Name must be less than 20 characters.";
        },
        (value) => {
          if (value?.length >= 2) return true;

          return "Name must be longer than 2 characters.";
        },
      ],
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
      issuedVC: {},
      issuedVCPopup: false,
      addVCDialog: false,
      addVCValid: false,
      addedVCName: "",
      addedVCBody: "",
      addVCDid: "",
      deleteVCDialog: false,
    };
  },
  methods: {
    refreshVCs(wallet) {
      if (!wallet || !wallet.dids) return;
      this.VCs = Object.entries(wallet.dids).map(([did, data]) => {
        const credentials = wallet.getVCs(did);

        return {
          did,
          name: data.metadata?.name || "Unnamed DID",
          privateKey: data.keyPair.privateKey,
          credentials,
        };
      });
    },

    initShowVCs() {
      if (this.showVCs !== null) return;
      this.showVCs = {};
      for (let VCList of this.VCs) {
        const creds = {};
        Object.entries(VCList.credentials).map(([name, vc]) => {
          creds[name] = false;
        });

        this.showVCs[VCList.did] = {
          displayed: false,
          creds,
        };
      }
    },

    async verifyVC(VCText) {
      // TODO: Add encryption/decryption
      // Parse the VC we were given
      const VC = JSON.parse(VCText);
      try {
        // Check the structure of the VC
        await VCService.verify(VC);
        // Check that the VC is valid according to the trust chain
        const res = await VCService.verifyTrustchain(VC);

        // TODO: Add better checking for the result to display a good message
        this.verifyVCAlert = true;
        this.verifyVCAlertColor = "success";
        this.verifyVCMessage = "Successful verification";
      } catch (err) {
        // TODO: Add better error communication to the user
        this.verifyVCAlert = true;
        this.verifyVCAlertColor = "error";
        this.verifyVCMessage = "Failed verification!!";
      }
    },

    async handleVerifyVC() {
      this.verifyVC(this.VCToVerify);
      this.VCToVerify = "";
    },

    /**
     * A method that returns a list of VC Types that you are authorized to issue
     * @param wallet The wallet storing the VCs
     * @param did The did of the issuer
     */
    getIssuableVCTypes(wallet, did) {
      // TODO: Integrate with the vc mapping
      return ["test"];
    },

    resetIssueVCForm() {
      this.issueVCFormData = {
        name: "",
        type: "",
        issuer: null,
        subject: "",
        claims: [],
      };
    },

    async issueVC(wallet) {
      if (!this.issueVCValid) return;

      // First, we make an unsigned VC
      const issuer = this.issueVCFormData.issuer.did; // issuer is an object from the VCs array
      const privateKey = this.issueVCFormData.issuer.privateKey;
      const subject = this.issueVCFormData.subject;
      const creationDate = new Date().toISOString;

      // Parse the claims into an object
      const claims = {};
      this.issueVCFormData.claims.forEach(({ key, val }) => {
        claims[key] = val;
      });

      // Create the Unsigned VC
      const unsigned = new UnsignedVCBuilder(
        ["VerifiableCredential", this.issueVCFormData.type],
        creationDate,
        issuer,
        subject,
        claims
      ).build();

      // Next, we sign the contents
      // Canonicalize the unsigned VC into a string
      const canon = canonicalize(unsigned);
      if (!canon) throw new Error("Failed to canonicalize VC");

      // Sign that string with the private key from the wallet
      if (!privateKey) throw new Error(`Missing private key for this DID: ${issuer}`);

      const signature = await sign(canon, privateKey);

      // Finally, we put together the unsigned VC and the signature
      const VC = new VCBuilder(
        unsigned,
        creationDate,
        issuer + "#keys-1", // The verification method is the first key of the issuer
        signature
      ).build();

      // Next, we update the wallet if the subject did is in the wallet
      if (wallet.dids[subject]) {
        this.addVC(wallet, subject, this.issueVCFormData.name, VC);
      }

      // Visual changes

      // Reset the form
      this.resetIssueVCForm();
      this.issueVCValid = false;

      // Show the VC
      this.issuedVC = JSON.stringify(VC, null, 2);

      // Close the Issue dialog
      this.issueVCDialog = false;

      // Open the popup
      this.issuedVCPopup = true;
    },

    async handleAddToClipboard() {
      await this.addToClipboard(this.issuedVC);
    },

    async addToClipboard(text) {
      await navigator.clipboard.writeText(text);
    },

    emptyCredentials(wallet, ind) {
      return Object.entries(this.VCs[ind].credentials).length === 0;
    },

    handleAddVC(wallet, did) {
      // Call the addVC method
      const VC = JSON.parse(this.addedVCBody);
      this.addVC(wallet, this.addVCDid, this.addedVCName, VC);

      // Take care of visual aspects
      this.addVCDialog = false;
      this.addVCValid = false;
      this.addedVCName = "";
      this.addedVCBody = "";
    },

    addVC(wallet, did, name, VC) {
      // TODO: Run verifyVC and check if the vc was issued to the did we are trying to add it to
      // Add the VC to the wallet
      wallet.addVC(did, name, VC);

      // Persist the wallet
      wallet.save();

      // Refresh the VCs
      this.refreshVCs(wallet);
    },

    handleDeleteVC(wallet, did, name) {
      this.deleteVC(wallet, did, name);
      this.deleteVCDialog = false;
    },

    deleteVC(wallet, did, name) {
      // Remove the VC from the wallet
      wallet.removeVC(did, name);

      // Persist the wallet
      wallet.save();

      // Refresh the VCs
      this.refreshVCs(wallet);
    },
  },
};
</script>

<style lang="css" scoped></style>
