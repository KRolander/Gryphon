import Api from "./Api";

export default {
  createDID(publicKey,service) {
    return Api().post("did/create", { publicKey,service});
  },

  getDIDDoc(DID) {
    if (!DID) {
      return Api().get(`did/getDIDDoc/`);
    }
    return Api().get(`did/getDIDDoc/${DID}`);
  },

  deleteDID(DID) {
    if (!DID) {
      return Api().delete(`did/deleteDID/`);
    }
    return Api().delete(`did/deleteDID/${DID}`);
  },

  modifyController(DID, operation, newController) {
    if (!DID) {
      return Api().patch(`did/updateDIDDoc/addController/`, { operation, newController });
    }
    return Api().patch(`did/updateDIDDoc/addController/${DID}`, { operation, newController });
  },
};
