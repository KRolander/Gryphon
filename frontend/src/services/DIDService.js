import Api from "./Api";

export default {
  createDID(name) {
    return Api().post("did/create", name);
  },
};
