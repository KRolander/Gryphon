import Api from "./Api";

export default {

    createMapping(mappingKey,mappingValue){
      return Api().post(`vc/createMapping/${mappingKey}/${mappingValue}`);
    },

    getMapping(mappingKey){
        return Api().get(`/getVCTypeMapping/${mappingKey}`);
    },
}