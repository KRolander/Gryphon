import Api from "./Api";

export default {
  /**
   * Creates a new DID document with a given public key and service endpoint.
   *
   * @param {string} publicKey - The public key to associate with the DID.
   * @param {string} service - A service endpoint to attach to the DID.
   * @returns {Promise<import('axios').AxiosResponse>} Axios response with the created DID.
   */
  createDID(publicKey, service) {
    return Api().post("did/create", { publicKey, service });
  },

  /**
   * Retrieves the DID Document.
   *
   * @param {string} DID DID to retrieve the document for.
   * @returns {Promise<import('axios').AxiosResponse>} Axios response containing the DID Document.
   */
  getDIDDoc(DID) {
    if (!DID) {
      return Api().get(`did/getDIDDoc/`);
    }
    return Api().get(`did/getDIDDoc/${DID}`);
  },

  /**
   * Deletes the specified DID Document.
   *
   * @param {string} DID The DID to delete.
   * @returns {Promise<import('axios').AxiosResponse>} Axios response after deletion.
   */
  deleteDID(DID) {
    if (!DID) {
      return Api().delete(`did/deleteDID/`);
    }
    return Api().delete(`did/deleteDID/${DID}`);
  },

  /**
   * Modifies the controller of a DID Document.
   *
   * @param {string} DID -  The DID to modify.
   * @param {string} operation - The type of modification operation (e.g., "add", "remove").
   * @param {string} newController - The new controller DID.
   * @returns {Promise<import('axios').AxiosResponse>} Axios response after update.
   */
  modifyValue(DID, operation, newController) {
    if (!DID) {
      return Api().patch(`did/updateDIDDoc/addController/`, { operation, newController });
    }
    return Api().patch(`did/updateDIDDoc/addController/${DID}`, { operation, newController });
  },
};
