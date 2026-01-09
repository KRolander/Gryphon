/* ------------------ IMPORTS ------------------*/
// core
const express = require("express");
const { TextDecoder } = require("util"); // TextDecoder is used to decode the byte array from the blockchain => we get bytes from the blockchain


const crypto = require("crypto");

var hash = "sha256";
var curve = "secp256k1";

//const { DIDDocument } = require("../chaincode/types/DIDDocument.js");
// gateway
const {
  startGateway,
  getGateway,
  storeDID,
  storeDID_dataStruct,
  getContract,
  getDIDDoc,
  getDID_dataStruct,
  addDIDController,
  deleteDID,
} = require("../gateway.js");

const { createDID } = require("../utility/DIDUtils.js");
const DIDDocument = require("../../utils/DIDDocumentBuilder.js");
const { default: DIDDocumentBuilder } = require("../../utils/DIDDocumentBuilder.js");
const logger = require("../utility/logger.js");
const { generateCorrelationId } = require("../utility/loggerUtils");
const { envOrDefault } = require("../utility/gatewayUtilities");
const sortKeysRecursive = require("sort-keys-recursive");

/* ------------------ CONFIG ------------------*/
const router = express.Router();
const utf8Decoder = new TextDecoder();

const DIDchannelName = envOrDefault("CHANNEL_NAME", "didchannel"); //the name of the channel from the fabric-network
const VCchannelName = envOrDefault("CHANNEL_NAME", "vcchannel");
const DIDchaincodeName = envOrDefault("CHAINCODE_NAME", "DIDcc"); //the chaincode name used to interact with the fabric-network
const VCchaincodeName = envOrDefault("CHAINCODE_NAME", "VCcc");

/**
 * @route POST /did/create
 * @summary Handles creation of a DID
 * @description The method establishes a gateway connection if needed, and creates a DID and a DID document
 * using the DIDDocumentBuilder. After this, it stores the DID and its document on the ledger
 *
 * @param {object} req.body - The body of the request
 * @param {string} req.body.publicKey - A PEM formatted string representing the public key of the DID
 * @param {string} [req.body.service] - The optional service endpoint of the DID linking to its public registry
 *
 * @returns {string} 400: "Public key is required" if public key is missing
 * @returns {string} 200: The string DID if everything went well
 * @returns {string} 500: "Error storing DID on the blockchain" if DID creation fails for any reason
 */
router.post("/create", async (req, res, next) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    // Check if the gateway has already been started
    if (getGateway() == null) {
      await startGateway();
    }

    const { publicKey: publicKey, service: service } = req.body;
    if (!publicKey) {
      const message = "Public key is required";
      logger.warn({
        action: "POST /did/create",
        correlationId: correlationId,
        message: message,
      });
      return res.status(400).send(message);
    }
    const DID = await createDID();
    let docBuilder;
    if (service) {
      docBuilder = new DIDDocumentBuilder(DID, DID, publicKey, service);
    } else {
      docBuilder = new DIDDocumentBuilder(DID, DID, publicKey);
    }

    const doc = docBuilder.build();

    const myData = {
      DID: "myDID",
      DID_PubKey: "myPubKey"
    };

    const _resultBytes = await storeDID_dataStruct(getContract(DIDchannelName, DIDchaincodeName), DID, myData);


    // const resultBytes = await storeDID(getContract(DIDchannelName, DIDchaincodeName), DID, doc);

    const successMessage = `DID ${DID} stored successfully!`;
    console.log(successMessage);
    logger.info({
      action: "POST /did/create",
      correlationId: correlationId,
      message: successMessage,
    });

    res.status(200).send(DID);
  } catch (error) {
    const errorMessage = "Error storing DID on the blockchain";
    console.log(errorMessage);
    logger.error({
      action: "POST /did/create",
      correlationId: correlationId,
      message: errorMessage,
    });
    res.status(500).send(errorMessage); // Send an error message to the client
  }
  next();
});


/**
 * @route POST /did/createDIDDataStruct
 * @summary Creates a new DID data structure which will be stored on the blockchain. Note: the DID (string, 
 * e.g.: did:hlf:AbCd... is issued by the external DID issuer in that case and sent in a post request)
 * @description  The DID data structure is populated from the data sent by the DID Issuer (external) service
 * DID data structure: (JSON)
 *    - DID (string)
 *    - DID public key or Controller's public key
 *    - Controller 
 *    - Decentralized flag version
 *    - Metadata 
 *        - DID Creation Timestamp
 *        - DID Update Timestamp
 *        - Action [CreateDID, UpdateDID]
 *        - Signature :  | DID Creation/Update Timestamp & Action | 
 * 
 * @param {object} req.body - The body of the request
 * 
 * @param {string} [req.body.publicKey] // Public key assigned to the DID holder / Controller
 * @param {object} req.body.DIDDataStructure // Contains the DID Data Structure issued by the DID issuer
 * @returns {string} 400: The DID data structure is not complete: missing elements {to be specified}
 * @returns {string} 200: The string DID data structure: (JSON) if everything went well
 * @returns {string} 500: "Error storing DID on the blockchain" if DID creation fails for any reason
//  TODO : *@returns {string} 501: "Error creating this DID on the blockchain is not possible since the DID already exists. You can Update it but not re-create." 
 */

router.post("/createDIDDataStruct", async (req, res, next) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    // Check if the gateway has already been started
    if (getGateway() == null) {
      await startGateway();
    }

    const { publicKey: pubkey, DIDDataStructure: DID_data } = req.body;
    

    // Mock chaincode logic
    if (!DID_data) {
      const message = "DID Data Structure is required";
      logger.warn({
        action: "POST /did/createDIDDataStruct",
        correlationId: correlationId,
        message: message,
      });
      return res.status(400).send(message);
    }


    let missing_element = [];
    if (!DID_data.Metadata.DIDCreationTimestamp || DID_data.Metadata.DIDCreationTimestamp === "") {
      missing_element.push("DIDCreationTimestamp")
    }
    if (!DID_data.Metadata.Action || DID_data.Metadata.Action === "") {
      missing_element.push("Action")
    }
    if (!DID_data.Metadata.Signature || DID_data.Metadata.Signature === "") {
      missing_element.push("Signature")
    }
    if (!DID_data.DID || DID_data.DID === "") {
      missing_element.push("DID")
    }
    if (!DID_data.DID_PubKey || DID_data.DID_PubKey === "") {
      missing_element.push("DID_PubKey")
    }
    if (!DID_data.Controller || DID_data.Controller === "") {
      missing_element.push("Controller")
    }
    if (!DID_data.DC_flag_version || DID_data.DC_flag_version === "") {
      missing_element.push("DC_flag_version")
    }

    if (missing_element.length > 0) {
      const arrayLength = missing_element.length;
      let message = "Missing data from DID Data Structure: ["

      for (var i = 0; i < arrayLength; i++) {
        message = message + missing_element[i] + " , ";
      }
      message = message + "]"
      logger.warn({
        action: "POST /did/createDIDDataStruct",
        correlationId: correlationId,
        message: message,
      });
      return res.status(400).send(message);
    }
    // Otherwise no elements missing next step can be computed


    // Call chain code to store the DID data structure
    const resultBytes = await storeDID_dataStruct(getContract(DIDchannelName, DIDchaincodeName), DID_data.DID, DID_data);

    const successMessage = `DID data strucure: ${DID_data} stored successfully!`;
    console.log(successMessage);
    logger.info({
      action: "POST /did/createDIDDataStruct",
      correlationId: correlationId,
      message: successMessage,
    });

    res.status(200).json(DID_data);
    ////////////////////////////////////////////////////////////////////
  } catch (error) {
    const errorMessage = "Error storing DID on the blockchain";
    console.log(errorMessage);
    logger.error({
      action: "POST /did/createDIDDataStruct",
      correlationId: correlationId,
      message: errorMessage,
    });
    res.status(500).send(errorMessage); // Send an error message to the client
  }
  next();
});




/**
 * @route POST /did/updateDIDDataStruct
 * @summary Update means that the DID holder/controller aims to modify the DID Document
 * this is possible if the holder is able to sign the time stamp and action {UpdateDID} and the 
 * and existing DID data structure corresponding to a DID string is already stored on the ledger
 * The chaincode cryptographically verfies the signature if it is true the DID Update Timestamp
 * is updated and the result is returned to the DID Issuer. The chaincode als vefifies the Controller
 * if it is diffenet from what previously was stored then the controller is updated.
 * @description  The Updated DID data structure is populated from the data sent by the DID Issuer (external) service
 * DID data structure: (JSON)
 *    - DID (string)
 *    - DID public key or Controller's public key
 *    - Controller 
 *    - Decentralized flag version
 *    - Metadata 
 *        - DID Creation Timestamp
 *        - DID Update Timestamp
 *        - Action [CreateDID, UpdateDID]
 *        - Signature :  | DID Creation/Update Timestamp & Action | 
 * 
 * @param {object} req.body - The body of the request
 * 
 * @param {string} [req.body.publicKey] // Public key assigned to the DID holder / Controller
 * @param {object} req.body.DIDDataStructure // Contains the DID Data Structure issued by the DID issuer
 * @returns {string} 400: The DID data structure is not complete: missing elements {to be specified}
 * @returns {string} 200: The string DID data structure: (JSON) if everything went well
 * @returns {string} 500: "Error storing DID on the blockchain" if DID creation fails for any reason
//  TODO : *@returns {string} 501: "Error creating this DID on the blockchain is not possible since the DID already exists. You can Update it but not re-create." 
 */

router.post("/updateDIDDataStruct", async (req, res, next) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    // Check if the gateway has already been started
    if (getGateway() == null) {
      await startGateway();
    }

    const { publicKey: pubkey, DIDDataStructure: DID_data } = req.body;
    

    // const resultBytes = await storeDID_dataStruct(getContract(DIDchannelName, DIDchaincodeName), DID_data.DID, DID_data);

    // const successMessage = `DID data strucure: ${DID_data} stored successfully!`;
    // console.log(successMessage);
    // logger.info({
    //   action: "POST /did/createDIDDataStruct",
    //   correlationId: correlationId,
    //   message: successMessage,
    // });

    // res.status(200).json(DID_data);
    ////////////////////////////////////////////////////////////////////

    // Mock chaincode logic
    if (!DID_data) {
      const message = "DID Data Structure is required";
      logger.warn({
        action: "POST /did/updateDIDDataStruct",
        correlationId: correlationId,
        message: message,
      });
      return res.status(400).send(message);
    }


    let missing_element = [];
    if (!DID_data.Metadata.DIDCreationTimestamp || DID_data.Metadata.DIDCreationTimestamp === "") {
      missing_element.push("DIDCreationTimestamp")
    }
    if (!DID_data.Metadata.Action || DID_data.Metadata.Action === "") {
      missing_element.push("Action")
    }
    if (!DID_data.Metadata.Signature || DID_data.Metadata.Signature === "") {
      missing_element.push("Signature")
    }
    if (!DID_data.DID || DID_data.DID === "") {
      missing_element.push("DID")
    }
    if (!DID_data.DID_PubKey || DID_data.DID_PubKey === "") {
      missing_element.push("DID_PubKey")
    }
    if (!DID_data.Controller || DID_data.Controller === "") {
      missing_element.push("Controller")
    }
    if (!DID_data.DC_flag_version || DID_data.DC_flag_version === "") {
      missing_element.push("DC_flag_version")
    }

    if (missing_element.length > 0) {
      const arrayLength = missing_element.length;
      let message = "Missing data from DID Data Structure: ["

      for (var i = 0; i < arrayLength; i++) {
        message = message + missing_element[i] + " , ";
      }
      message = message + "]"
      logger.warn({
        action: "POST /did/updateDIDDataStruct",
        correlationId: correlationId,
        message: message,
      });
      return res.status(400).send(message);
    }
    // Otherwise no elements missing next step can be computed


    // Verifiy if signature is correct
    // the message was manipulated or the DID was not issued
    // with the private key corresponding to the public key
    const signature = DID_data.Metadata.Signature;
    const publicKey = DID_data.DID_PubKey;
    const verify = crypto.createVerify(hash);
    const msg =  DID_data.Metadata.Action + DID_data.Metadata.DIDCreationTimestamp;
    verify.write(msg);
    verify.end();


    if (!verify.verify(publicKey, signature, 'hex')) {
      const errorMessage = "Error storing DID on the blockchain - Signature is not Valid!";
      console.log(errorMessage);
      logger.error({
        action: "POST /did/updateDIDDataStruct",
        correlationId: correlationId,
        message: errorMessage,
      });
      res.status(500).send(errorMessage); // Send an error message to the client
    }

    // Call chain code to store the DID data structure
    const resultBytes = await storeDID_dataStruct(getContract(DIDchannelName, DIDchaincodeName), DID_data.DID, DID_data);

    // const _resultBytes = await storeDID_dataStruct(getContract(DIDchannelName, DIDchaincodeName), DID, DID);

    const successMessage = `DID data strucure: ${DID_data} stored successfully!`;
    console.log(successMessage);
    logger.info({
      action: "POST /did/updateDIDDataStruct",
      correlationId: correlationId,
      message: successMessage,
    });

    res.status(200).json(DID_data);
    ////////////////////////////////////////////////////////////////////
  } catch (error) {
    const errorMessage = "Error storing DID on the blockchain";
    console.log(errorMessage);
    logger.error({
      action: "POST /did/updateDIDDataStruct",
      correlationId: correlationId,
      message: errorMessage,
    });
    res.status(500).send(errorMessage); // Send an error message to the client
  }
  next();
});



/**
 * @route GET /did/getDIDDoc
 * @summary Handles getting the DID document of a DID when no parameter is provided
 *
 * @returns {string} 400: "DID is required" if DID is missing
 */
router.get("/getDIDDoc/", async (req, res) => {
  return res.status(400).send("DID is required");
});

/**
 * @route GET /did/getDIDDoc/:did
 * @summary Handles getting the DID document of a DID when the DID is provided
 * @description The method establishes a gateway connection if needed, then retrieves the document for the provided
 * DID from the ledger
 *
 * @param {object} req.params - The parameters of the request
 * @param {string} req.params.did - The DID to retrieve the DID document for
 *
 * @returns {object} 200: The DID document as a JSON for the provided DID if everything went well
 * @returns {string} 500: "Error querying DID from blockchain" if retrieval fails for any reason
 */
router.get("/getDIDDoc/:did", async (req, res) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    const DID = req.params.did;

    if (getGateway() == null) await startGateway();

    console.log("Retrieving DID document...");

    const doc = await getDIDDoc(getContract(DIDchannelName, DIDchaincodeName), DID);

    console.log(`✅ DID document for ${DID} retrieved succesfully!`);
    const successMessage = `DID document for ${DID} retrieved succesfully!`;
    logger.info({
      action: "GET /did/getDIDDoc",
      correlationId: correlationId,
      message: successMessage,
    });

    res.status(200).json(doc);
  } catch (error) {
    console.error("❌ Error retrieving the document from blockchain:", error);
    const errorMessage = "Error retrieving the document from blockchain";
    logger.info({
      action: "GET /did/getDIDDoc",
      correlationId: correlationId,
      message: errorMessage,
    });
    res.status(500).send("Error querying DID from blockchain");
  }
});

/**
 * @route GET /did/getDID/:did
 * @summary Handles getting the DID Data structure of a DID when the DID is provided
 * @description The method establishes a gateway connection to the DLT if needed, then retrieves the DID data for the provided
 * DID from the ledger
 *
 * @param {object} req.params - The parameters of the request
 * @param {string} req.params.did - The DID to retrieve the DID Data structure for the assoviated DID
 *
 * @returns {object} 200: The DID Data Structure as a JSON for the provided DID if everything went well
 * @returns {string} 500: "Error querying DID from DLT" if retrieval fails for any reason
 */
router.get("/getDID/:did", async (req, res) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    const DID = req.params.did;

    if (getGateway() == null) await startGateway();

    console.log("Retrieving DID Data Structure...");

    const doc = await getDID_dataStruct(getContract(DIDchannelName, DIDchaincodeName), DID);

    console.log(`✅ DID Data structure for ${DID} retrieved succesfully!`);
    const successMessage = `DID Data structure for ${DID} retrieved succesfully!`;
    logger.info({
      action: "GET /did/getDID",
      correlationId: correlationId,
      message: successMessage,
    });

    res.status(200).json(doc);
  } catch (error) {
    console.error("❌ Error retrieving the DID Data structure from DLT:", error);
    const errorMessage = "Error retrieving the DID Data structure from DLT";
    logger.info({
      action: "GET /did/getDID",
      correlationId: correlationId,
      message: errorMessage,
    });
    res.status(500).send("Error querying DID data structure from DLT");
  }
});


/**
 * @route PATCH /did/updateDIDDoc/addController
 * @summary Handles updating of a DID document when no parameter is provided
 *
 * @returns {string} 400: "No target DID" if DID is missing
 */
router.patch("/updateDIDDoc/addController/", async (req, res) => {
  return res.status(400).send("No target DID");
});

/**
 * @route PATCH did/updateDIDDoc/addController/:did
 * @summary Handles updating the DID document of a DID when the DID is provided
 * @description For now the method only adds a controller or changes the service endpoint. It establishes a gateway
 * connection if needed and checks for the operation to handle the editing logic, choosing from the following two:
 *    -addController: queries the document from the blockchain given the DID, checks if the given controller is already
 *                    in the document and if not, it is added and the document gets updated on the ledger.
 *    -modifyService: queries the document from the blockchain given the DID. If the provided service is empty,
 *                    it deletes the service from the DID document. If the provided service is the same as in the
 *                    document it throws an error, else adds or overrides the service and the document gets updated on
 *                    the ledger.
 *
 * @param {object} req.params - The parameters of the request
 * @param {string} req.params.did - The DID to update the DID document for
 *
 * @param {object} req.body - The body of the request
 * @param {string} req.body.operation - A string representing the operation to be done on the DID document
 * @param {string} req.body.newController - The string value that needs to be updated in the DID document
 *
 * @returns {string} 400: "Invalid request" if the value for the operation is invalid
 *
 * Regarding the addController operation:
 *    @returns {string} 400: "Invalid request" if the value for newController is invalid
 *    @returns {string} 400: "No controller" if the newController DID is not a valid DID on the ledger
 *    @returns {string} 400: "DID ${targetDID} already has controller ${newController}" if the target DID already has
 *                          newController as a controller in its document
 *    @returns {string} 200: "Controller added successfully" if the controller was updated correctly
 *
 * Regarding the modifyService operation:
 *    @returns {string} 200: "Endpoint deleted successfully" if newController is invalid
 *    @returns {string} 400: "DID ${targetDID} already has endpoint ${newController}" if the target DID already has
 *                          newController as a service in its document
 *    @returns {string} 200: "Endpoint modified successfully" if the service was updated correctly
 *
 * @returns {string} 400: "Not yet implemented or operation not allowed" if the operation was valid but not addController
 *                        or modifyService
 * @returns {string} 500: "Error updating DID" if updating fails for any reason
 */
router.patch("/updateDIDDoc/addController/:did", async (req, res) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    if (getGateway() == null) await startGateway();

    const targetDID = req.params.did;
    const { operation, newController } = req.body;

    if (!operation) {
      const message = "Invalid request";
      logger.warn({
        action: "PATCH did/updateDIDDoc/addController",
        correlationId: correlationId,
        message: message,
      });
      return res.status(400).send(message);
    }
    if (operation === "addController") {
      if (!newController) {
        const message = "Invalid request";
        logger.warn({
          action: "PATCH did/updateDIDDoc/addController",
          correlationId: correlationId,
          message: message,
        });
        return res.status(400).send(message);
      }

      try {
        await getDIDDoc(getContract(DIDchannelName, DIDchaincodeName), newController);
      } catch (err) {
        const errorMessage = `There is no controller with DID ${newController}`;
        logger.warn({
          action: "PATCH did/updateDIDDoc/addController",
          correlationId: correlationId,
          message: errorMessage,
        });
        console.error(errorMessage);
        return res.status(400).send("No controller");
      }

      //retrieve the targetDID document
      let doc = await getDIDDoc(getContract(DIDchannelName, DIDchaincodeName), targetDID);
      if (typeof doc.controllers === "string") {
        doc.controllers = [doc.controllers];
      }
      // could also check if the DID we want to add as a controller exists
      if (doc.controllers.includes(newController)) {
        const errorMessage = "Duplicate controller";
        logger.warn({
          action: "PATCH did/updateDIDDoc/addController",
          correlationId: correlationId,
          message: errorMessage,
        });
        console.error(errorMessage);
        return res.status(400).send(`DID ${targetDID} already has controller ${newController}`);
      } else doc.controllers.push(newController);

      await addDIDController(getContract(DIDchannelName, DIDchaincodeName), targetDID, doc);

      const successMessage = `Controller ${newController} added successfully for DID ${targetDID}`;
      logger.info({
        action: "PATCH did/updateDIDDoc/addController",
        correlationId: correlationId,
        message: successMessage,
      });
      console.log(successMessage);
      return res.status(200).send("Controller added successfully");
    } else if (operation === "modifyService") {
      let doc = await getDIDDoc(getContract(DIDchannelName, DIDchaincodeName), targetDID);
      if (!newController) {
        delete doc.service[0].serviceEndpoint;
        const successMessage = `Endpoint deleted successfully for DID ${targetDID}`;
        logger.info({
          action: "PATCH did/updateDIDDoc/addController",
          correlationId: correlationId,
          message: successMessage,
        });
        console.log(successMessage);
        await addDIDController(getContract(DIDchannelName, DIDchaincodeName), targetDID, doc);
        return res.status(200).send("Endpoint deleted successfully");
      } else if (doc.service[0].serviceEndpoint === newController) {
        const errorMessage = "Duplicate endpoint";
        logger.warn({
          action: "PATCH did/updateDIDDoc/addController",
          correlationId: correlationId,
          message: errorMessage,
        });
        console.error(errorMessage);
        return res.status(400).send(`DID ${targetDID} already has endpoint ${newController}`);
      } else doc.service[0].serviceEndpoint = newController;

      await addDIDController(getContract(DIDchannelName, DIDchaincodeName), targetDID, doc);

      const successMessage = `Endpoint ${newController} modified successfully for DID ${targetDID}`;
      logger.info({
        action: "PATCH did/updateDIDDoc/addController",
        correlationId: correlationId,
        message: successMessage,
      });
      console.log(successMessage);
      res.status(200).send("Endpoint modified successfully");
    } else {
      const errorMessage = "Not yet implemented or operation not allowed";
      logger.warn({
        action: "PATCH did/updateDIDDoc/addController",
        correlationId: correlationId,
        message: errorMessage,
      });
      res.status(400).send("Not yet implemented or operation not allowed");
    }
  } catch (error) {
    const errorMessage = "Error updating DID";
    logger.warn({
      action: "PATCH did/updateDIDDoc/addController",
      correlationId: correlationId,
      message: errorMessage,
    });
    console.error(errorMessage, error);
    res.status(500).send(errorMessage);
  }
});

/**
 * @route DELETE /did/deleteDID/
 * @summary Handles deletion of a DID and its DID document from the ledger when no parameter is provided
 *
 * @returns {string} 400: "DID is required" if DID is missing
 */
router.delete("/deleteDID/", async (req, res) => {
  return res.status(400).send("DID is required");
});

/**
 * @route DELETE /did/deleteDID/:did
 * @summary Handles deletion of a DID and its DID document from the ledger when no parameter is provided
 * @description The method establishes a gateway connection if needed, then deletes the DID and the document for the
 * provided DID from the ledger
 *
 * @param {object} req.params - The parameters of the request
 * @param {string} req.params.did - The DID to delete alongside its document
 *
 * @returns {string} 200: "DID deleted successfully" if the DID and its document were removed from the ledger
 * @returns {object} 404: A JSON object with a reason and a message if the DID is not on the ledger
 * @returns {object} 500: A JSON object with a reason and an error message if anything failed while deleting a DID and
 * its document
 */
router.delete("/deleteDID/:did", async (req, res) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    const DID = req.params.did;

    if (getGateway() == null) await startGateway();

    await deleteDID(getContract(DIDchannelName, DIDchaincodeName), DID);

    const successMessage = `DID ${DID} deleted successfully`;
    logger.info({
      action: "DELETE /did/deleteDID",
      correlationId: correlationId,
      message: successMessage,
    });
    console.log(successMessage);
    return res.status(200).send("DID deleted successfully");
  } catch (error) {
    console.error("Error while trying to delete the DID:", error);

    const errorMessage = error?.details?.[0]?.message || "";

    // If the DID is not found on chain, let frontend handle it
    if (errorMessage.includes("it doesn't exist")) {
      const errorMessage = `DID ${req.params.did} does not exist on-chain`;
      logger.warn({
        action: "DELETE /did/deleteDID",
        correlationId: correlationId,
        message: errorMessage,
      });
      return res.status(404).json({
        reason: "DID_NOT_FOUND",
        message: errorMessage,
      });
    }
    // Otherwise return a generic error
    const errMessage = "Failed to delete DID";
    logger.warn({
      action: "DELETE /did/deleteDID",
      correlationId: correlationId,
      message: errMessage,
    });
    return res.status(500).json({
      reason: "UNKNOWN_ERROR",
      message: errMessage,
    });
  }
});

module.exports = router;
