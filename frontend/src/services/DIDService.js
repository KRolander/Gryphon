import Api from "./Api";
import {createRouterMatcher as Promise} from "vue-router/dist/vue-router.esm-browser.js";

export default {
  createDID(publicKey) {
    return Api().post("did/create", {publicKey});
  },

  getDIDDoc(DID){
    if (!DID){
      return Api().get(`did/getDIDDoc/`);
    }
    return Api().get(`did/getDIDDoc/${DID}`);
  },

  deleteDID(DID){
    if (!DID){
      return Api().delete(`did/deleteDID/`);
    }
    return Api().delete(`did/deleteDID/${DID}`);

  },

  modifyController(DID, operation, newController) {
    if (!DID){
      return Api().patch(`did/updateDIDDoc/addController/`,{operation,newController})
    }
    return Api().patch(`did/updateDIDDoc/addController/${DID}`,{operation,newController});
  }
};
