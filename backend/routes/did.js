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

    res.status(200).send(DID); // Send the DID to the client
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

router.get("/getDIDDoc/", async (req, res) => {
  return res.status(400).send("DID is required");
});
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

router.patch("/updateDIDDoc/addController/", async (req, res) => {
  return res.status(400).send("No target DID");
});
router.patch("/updateDIDDoc/addController/:did", async (req, res) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    const targetDID = req.params.did;
    const { operation, newController } = req.body;

    if (!operation || !newController) {
      const message = "Invalid request";
      logger.warn({
        action: "PATCH did/updateDIDDoc/addController",
        correlationId: correlationId,
        message: message,
      });
      res.status(400).send(message);
    }
    if (operation === "addController") {
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
      res.status(200).send("Controller added successfully");
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
    const errorMessage = "Error retrieving the document from blockchain";
    logger.warn({
      action: "PATCH did/updateDIDDoc/addController",
      correlationId: correlationId,
      message: errorMessage,
    });
    console.error("Error retrieving the document from blockchain:", error);
    res.status(500).send("Error querying DID from blockchain");
  }
});

router.delete("/deleteDID/", async (req, res) => {
  return res.status(400).send("DID is required");
});
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
    res.status(200).send("DID deleted successfully");
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
