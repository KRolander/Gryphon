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
  getDIDDoc
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
    // const resultText = utf8Decoder.decode(resultBytes); // Decode the byte stream to a string
    // const result = JSON.parse(JSON.parse(resultText)); // Parse the string to a JSON object

    //const DID = `did:hlf:${result.org}_${result.methodID}`; // Create the DID from the result

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

    const doc = await getDIDDoc(getContract(), DID);

    res.status(200).json(doc);
  } catch (error) {
    console.error("Error retriving the document from blockchain:", error);
    res.status(500).send("Error querying DID from blockchain");
  }
});

module.exports = router;