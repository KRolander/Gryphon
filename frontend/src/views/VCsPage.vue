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
        <!-- Run setup functions that depend on the wallet -->
        <div style="display: none">
          {{ getIssuableVCTypes(wallet) }}
          {{ refreshVCs(wallet) }}
        </div>

        <!-- Card for the VCs sorted by DID -->
        <v-row class="w-100">
          <v-col cols="12">
            <v-card class="mx-auto">
              <!-- Card Title -->
              <template v-slot:title>
                <span class="font-weight-black">Your VCs</span>
              </template>

              <!-- Button to issue VCs -->
              <template v-slot:append>
                <v-dialog v-model="issueVCDialog" max-width="500">
                  <!-- Activator button -->
                  <template v-slot:activator="{ props: issueButtonProps }">
                    <v-btn
                      v-bind="issueButtonProps"
                      variant="outlined"
                      @click="issueVCDialog = true"
                    >
                      Issue VC <v-icon icon="mdi-file-document-plus" end></v-icon>
                    </v-btn>
                  </template>

                  <!-- Dialog -->
                  <template v-slot:default="{ isActive }">
                    <v-card title="Issue VC">
                      <v-card-text>
                        <v-form
                          id="issueForm"
                          v-model="issueVCValid"
                          @submit.prevent="(e) => issueVC(wallet)"
                        >
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

                    <!-- Delete DID -->
                    <!-- <template v-slot:append>
                      <v-dialog v-model="deleteDIDDialog" max-width="500">
                        <!-- Activator button 
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

                        <!-- Dialog 
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
                    </template> -->

                    <template v-slot:append>
                      <v-btn
                        class="ma-2"
                        variant="outlined"
                        @click="console.log('need to add a vc')"
                      >
                        Add <v-icon icon="mdi-plus-circle" end />
                      </v-btn>
                      <v-btn
                        class="ma-2"
                        variant="outlined"
                        @click="VCList.displayed = !VCList.displayed"
                      >
                        <span v-if="VCList.displayed">Hide VCs</span>
                        <span v-else>Show VCs</span>
                      </v-btn>
                    </template>

                    <v-card-text class="bg-surface-light pt-4">
                      <v-card class="mb-4 mt-4" color="grey-lighten-1">
                        <template
                          v-if="VCList.displayed"
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
                                <!-- Make this a delete button -->
                                <v-btn
                                  class="ma-2"
                                  variant="outlined"
                                  @click="deleteVC()"
                                >
                                  Delete VC <v-icon icon="mdi-file-document-remove-outline" end />
                                </v-btn>
                              </template>

                              <v-card-actions>
                                <v-btn
                                  class="ma-2"
                                  variant="outlined"
                                  @click="VC.displayed = !VC.displayed"
                                >
                                  <span v-if="VC.displayed">Hide VC</span>
                                  <span v-else>Show VC</span>
                                </v-btn>
                              </v-card-actions>

                              <v-card class="mb-4 mt-4" color="grey-lighten-1">
                                <pre
                                  v-if="VC.displayed"
                                  class="text-body-1 font-weight-light mb-n1"
                                  style="
                                    white-space: pre-wrap;
                                    word-break: break-word;
                                    padding: 0 16px;
                                  "
                                >
                                  {{ VC.VC }}
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
      issueVCDialog: false,
      issueVCValid: false,
      issueVCFormData: {
        name: "",
        type: "",
        issuer: "",
        subject: "",
        claims: {},
        verificationMethod: "",
      },
      issuedVC: {},
    };
  },
  methods: {
    refreshVCs(wallet) {
      if (!wallet || !wallet.dids) return;
      this.VCs = Object.entries(wallet.dids).map(([did, data]) => {
        // Testing only, remove later
        // const credentials = wallet.getVCs(did);
        const credentials = {
          ceva: {
            a: 1,
            b: 2,
          },
          altceva: {
            a: 3,
            b: 4,
          },
        };
        // Add any extra properties we need
        Object.keys(credentials).forEach((key) => {
          const original = credentials[key];
          credentials[key] = {
            VC: original,
            // Here we can add any variables relating to individual VCs
            displayed: false,
          };
        });

        return {
          did,
          name: data.metadata?.name || "Unnamed DID",
          credentials,
          // Here we can add any variables relating to VC Lists
          displayed: false,
        };
      });
    },

    /**
     * A method that returns a list of VC Types that you are authorized to issue
     * @param wallet The wallet storing the VCs
     * @param did The did of the issuer
     */
    getIssuableVCTypes(wallet, did) {
      if (!did) did = wallet.activeDid;
    },

    async issueVC(wallet) {
      if (!this.issueVCValid) return;

      // First, we make an unsigned VC
      const issuer = this.issueVCFormData.issuer.did; // issuer is a pair of did and name
      const creationDate = new Date().toISOString;
      const unsigned = UnsignedVCBuilder(
        ["VerifiableCredential", this.issueVCFormData.type],
        creationDate,
        issuer,
        this.issueVCFormData.subject,
        this.issueVCFormData.claims
      ).build();

      // Next, we sign the contents
      // Canonicalize the unsigned VC into a string
      const canon = canonicalize(unsigned);
      if (!canon) throw new Error("Failed to canonicalize VC");

      // Sign that string with the private key from the wallet
      const privateKey = wallet.dids[issuer].metadata?.privateKey;
      if (!privateKey) throw new Error(`Missing private key for this DID: ${issuer}`);

      const signature = await sign(canon, privateKey);

      // Finally, we put together the unsigned VC and the signature
      const VC = VCBuilder(
        unsigned,
        creationDate,
        this.issueVCFormData.verificationMethod,
        signature
      ).build();
      this.issuedVC = VC;

      // Next, we update the wallet if the subject did is in the wallet
      if (wallet.dids[did]) {
        wallet.addVC(did, this.issueVCFormData.name, VC);

        // Persist the wallet
        wallet.save();
        this.refreshVCs(wallet);
      }

      // Reset the form
      this.issueVCFormData = {
        name: "",
        type: [],
        issuer: "",
        subject: "",
        claims: {},
        verificationMethod: "",
      };
      this.issueVCValid = false;

      // Close the dialog
      this.issueVCDialog = false;
    },

    emptyCredentials(wallet, ind) {
      return Object.entries(this.VCs[ind].credentials).length === 0;
    },

    addVC(wallet, did, name, VC) {
      // To be added
      // wallet.addVC(did, name, VC);
    },

    deleteVC(wallet, did, name) {
      // To be added
      // wallet.removeVC(did, name);
    },
  },
};
</script>

<style lang="css" scoped></style>
