import Api from "./Api";

export default {
  createMapping(mappingKey, mappingValue) {
    return Api().post(`vc/createMapping/${mappingKey}/${mappingValue}`);
  },

  getMapping(mappingKey) {
    return Api().get(`vc/getVCTypeMapping/${mappingKey}`);
  },

  verify(VC) {
    return Api().post(`vc/verify`, VC);
  },

  verifyTrustchain(VC) {
    return Api().post(`vc/verifyTrustchain`, VC);
  },
};
