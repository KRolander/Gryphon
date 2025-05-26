import Api from "./Api";

export default {
  createDID(publicKey) {
    return Api().post("did/create", {publicKey});
  },

  getDIDDoc(DID){
    return Api().get(`did/getDIDDoc/${DID}`);
  }
};
