import Api from "./Api";
import {createRouterMatcher as Promise} from "vue-router/dist/vue-router.esm-browser.js";

export default {
  createDID(publicKey) {
    return Api().post("did/create", {publicKey});
  },

  getDIDDoc(DID){
    return Api().get(`did/getDIDDoc/${DID}`);
  },

  deleteDID(DID){
    return Api().delete(`did/deleteDID/${DID}`);

  },

  modifyController(DID, operation, newController) {
    return Api().patch(`did/updateDIDDoc/addController/${DID}`,{operation,newController});
  }
};
