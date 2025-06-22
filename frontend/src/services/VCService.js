import Api from "./Api";
import { createRouterMatcher as Promise } from "vue-router";

export default {
  createMapping(mappingKey, mappingValue) {
    return Api().post(`vc/createMapping/${mappingKey}/${mappingValue}`);
  },

  getMapping(mappingKey) {
    return Api().get(`vc/getVCTypeMapping/${mappingKey}`);
  },

  setRootTAO(newRoot) {
    return Api().patch(`vc/setRootTAO/${newRoot}`);
  },

  verify(VC) {
    return Api().post(`vc/verify`, VC);
  },

  verifyTrustchain(VC) {
    return Api().post(`vc/verifyTrustchain`, VC);
  },
};
