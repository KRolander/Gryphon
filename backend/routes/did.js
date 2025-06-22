/* ------------------ IMPORTS ------------------*/
// core
const express = require("express");
const { TextDecoder } = require("util"); // TextDecoder is used to decode the byte array from the blockchain => we get bytes from the blockchain

//const { DIDDocument } = require("../chaincode/types/DIDDocument.js");
// gateway
const {
  startGateway,
  getGateway,
  storeDID,
  getContract,
  getDIDDoc,
  addDIDController,
  deleteDID,
} = require("../gateway.js");

const { createDID } = require("../utility/DIDUtils.js");
const DIDDocument = require("../../utils/DIDDocumentBuilder.js");
const { default: DIDDocumentBuilder } = require("../../utils/DIDDocumentBuilder.js");
const logger = require("../utility/logger.js");
const { generateCorrelationId } = require("../utility/loggerUtils");
const { envOrDefault } = require("../utility/gatewayUtilities");

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

    const resultBytes = await storeDID(getContract(DIDchannelName, DIDchaincodeName), DID, doc);

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
 * @returns {object} 404: a JSON object with a reason and a message
 * @returns {object} 500: s JSON object with a reason and an error message
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
