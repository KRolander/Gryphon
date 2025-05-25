import Api from "./Api";

export default {
  createDID(publicKey) {
    return Api().post("did/create", {publicKey});
  },
};
