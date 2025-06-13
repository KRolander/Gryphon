<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center" max-width="800">
    <div>
      <div class="mb-8 text-center">
        <div class="text-body-1 font-weight-light mb-n1">Welcome to</div>
        <h1 class="text-h1 font-weight-bold">Your VCs</h1>
      </div>
    </div>

    <WalletManager v-slot="{ wallet, ready }">
      <template v-if="ready">
        
      </template>
    </WalletManager>
  </v-container>
</template>

<script lang="js">
/* ----------------------- IMPORTS ----------------------- */
import WalletManager from '@/components/wallet/WalletManager.vue';

/* ----------------------- CONFIG ----------------------- */
export default {
  name: "VCsPage",
  components: { WalletManager },
  data() {
    return {
      VCs: []
    };
  },
  methods: {

  }
};
</script>

<style lang="css" scoped></style>
