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
const {envOrDefault} = require("../utility/gatewayUtilities");

/* ------------------ CONFIG ------------------*/
const router = express.Router();
const utf8Decoder = new TextDecoder();

const DIDchannelName = envOrDefault("CHANNEL_NAME", "didchannel"); //the name of the channel from the fabric-network
const VCchannelName = envOrDefault("CHANNEL_NAME", "vcchannel");
const DIDchaincodeName = envOrDefault("CHAINCODE_NAME", "DIDcc"); //the chaincode name used to interact with the fabric-network
const VCchaincodeName = envOrDefault("CHAINCODE_NAME", "VCcc");

router.post("/create", async (req, res, next) => {
  try {
    // Check if the gateway is already started
    if (getGateway() == null) {
      await startGateway();
    }

    const { publicKey } = req.body;
    if (!publicKey) {
      return res.status(400).send("Public key is required");
    }
    const DID = await createDID();
    const docBuilder = new DIDDocumentBuilder(DID, DID, publicKey);
    const doc = docBuilder.build();

    const resultBytes = await storeDID(getContract(DIDchannelName,DIDchaincodeName), DID, doc);

    console.log(`DID ${DID} stored successfully!`); // Log the transaction
    res.status(200).send(DID); // Send the DID to the client
  } catch (error) {
    console.log(error);
    res.status(500).send("Error storing DID on the blockchain"); // Send an error message to the client
  }
  next();
});

router.get("/getDIDDoc/", async (req, res) => {
  return res.status(400).send("DID is required");
});
router.get("/getDIDDoc/:did", async (req, res) => {
  try {
    const DID = req.params.did;

    if (getGateway() == null) await startGateway();

    console.log("Retrieving DID document...");

    const doc = await getDIDDoc(getContract(DIDchannelName,DIDchaincodeName), DID);

    console.log(`✅ DID document for ${DID} retrieved succesfully!`);
    res.status(200).json(doc);
  } catch (error) {
    console.error("❌ Error retrieving the document from blockchain:", error);
    res.status(500).send("Error querying DID from blockchain");
  }
});

router.patch("/updateDIDDoc/addController/", async (req, res) => {
  return res.status(400).send("No target DID");
});
router.patch("/updateDIDDoc/addController/:did", async (req, res) => {
  try {
    const targetDID = req.params.did;
    const { operation, newController } = req.body;

    if (!operation || !newController) res.status(400).send("Invalid request");
    if (operation === "addController") {
      try {
        await getDIDDoc(getContract(DIDchannelName,DIDchaincodeName), newController);
      } catch (err) {
        console.error(`There is no controller with DID ${newController}`);
        return res.status(400).send("No controller");
      }

      //retrieve the targetDID document
      let doc = await getDIDDoc(getContract(DIDchannelName,DIDchaincodeName), targetDID);
      if (typeof doc.controllers === "string") {
        doc.controllers = [doc.controllers];
      }
      //could also check if the DID we want to add as a controller exists
      if (doc.controllers.includes(newController)) {
        console.error("Duplicate controller");
        return res.status(400).send(`DID ${targetDID} already has controller ${newController}`);
      } else doc.controllers.push(newController);

      await addDIDController(getContract(DIDchannelName,DIDchaincodeName), targetDID, doc);
      console.log(`Controller ${newController} added successfully for DID ${targetDID}`);
      res.status(200).send("Controller added successfully");
    } else {
      res.status(400).send("Not yet implemented or operation not allowed");
    }
  } catch (error) {
    console.error("Error retrieving the document from blockchain:", error);
    res.status(500).send("Error querying DID from blockchain");
  }
});

router.delete("/deleteDID/", async (req, res) => {
  return res.status(400).send("DID is required");
});
router.delete("/deleteDID/:did", async (req, res) => {
  try {
    const DID = req.params.did;

    if (getGateway() == null) await startGateway();

    await deleteDID(getContract(DIDchannelName,DIDchaincodeName), DID);
    console.log(`DID ${DID} deleted successfully`);
    res.status(200).send("DID deleted successfully");
  } catch (error) {
    console.error("Error while trying to delete the DID:", error);

    const errorMessage = error?.details?.[0]?.message || "";

    // If the DID is not found on chain, let frontend handle it
    if (errorMessage.includes("it doesn't exist")) {
      return res.status(404).json({
        reason: "DID_NOT_FOUND",
        message: `DID ${req.params.did} does not exist on-chain`,
      });
    }
    // Otherwise return a generic error
    return res.status(500).json({
      reason: "UNKNOWN_ERROR",
      message: "Failed to delete DID",
    });
  }
});

module.exports = router;
