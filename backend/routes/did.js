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
  deleteDID
} = require("../gateway");

const { createDID } = require("../utility/DIDUtils");
const DIDDocument = require('../../utils/DIDDocumentBuilder.js');
const { default: DIDDocumentBuilder } = require("../../utils/DIDDocumentBuilder.js");

/* ------------------ CONFIG ------------------*/
const router = express.Router();
const utf8Decoder = new TextDecoder();

router.post("/create", async (req, res, next) => {
  //TODO: create the DID somewhere around here
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

    const resultBytes = await storeDID(getContract(), DID, doc);

    console.log(`DID ${DID} stored successfully!`); // Log the transaction
    res.status(200).send(DID); // Send the DID to the client
  } catch (error) {
    console.log(error);
    res.status(500).send("Error storing DID on the blockchain"); // Send an error message to the client
  }
  next();
});

router.get("/getDIDDoc/:did", async (req, res) => {
  try {
    const DID = req.params.did;

    if(!DID) return res.status(400).send("DID is required");

    if(getGateway() == null)
      await startGateway();

    console.log("Retrieving DID document...");

    const doc = await getDIDDoc(getContract(), DID);

    console.log(`✅ DID document for ${DID} retrieved succesfully!`);
    res.status(200).json(doc);
  } catch (error) {
    console.error("❌ Error retrieving the document from blockchain:", error);
    res.status(500).send("Error querying DID from blockchain");
  }
});

router.patch("/updateDIDDoc/addController/:did", async (req, res) => {
  try {
    const targetDID = req.params.did;
    const { operation, newController } = req.body;
    if(!targetDID || !operation || !newController)
      res.status(400).send("Invalid request");
    if(operation === "addController") {
      //retrieve the targetDID document
      let doc = await getDIDDoc(getContract(), targetDID);

      //could also check if the DID we want to add as a controller exists
      doc.controllers.push(newController);

      await addDIDController(getContract(), targetDID, doc);
      console.log(`Controller ${newController} added successfully for DID ${targetDID}`);
      res.status(200).send("Controller added successfully");
    } else {
      res.status(400).send("Not yet implemented or operation not allowed");
    }
  } catch(error) {
    console.error("Error retrieving the document from blockchain:", error);
    res.status(500).send("Error querying DID from blockchain");
  }
});

router.delete("/deleteDID/:did", async(req, res) =>{

  try {
    const DID = req.params.did;

    if(!DID)
      return res.status(400).send("DID required");

    if(getGateway() == null)
      await startGateway();

    await deleteDID(getContract(), DID);
    console.log(`DID ${DID} deleted successfully`);
    res.status(200).send("DID deleted successfully");
  } catch(error) {
    console.error("Error while trying to delete the DID:", error);
    res.status(500).send("Failed to delete DID");
  }
});

module.exports = router;
