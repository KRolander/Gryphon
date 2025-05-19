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
  generateDIDDocument,
} = require("../gateway");
/* ------------------ CONFIG ------------------*/
const router = express.Router();
const utf8Decoder = new TextDecoder();

router.post("/create", async (req, res, next) => {

  try {
    // Check if the gateway is already started
    if (getGateway() == null) {
      await startGateway();
    }

    const { DID, publicKey } = req.body;
    if (!DID || !publicKey) {
      return res.status(400).send("DID is required");
    }

    const doc = {
      id: DID,
      "@context": "...", // if needed
      valid: true        // if needed
    };

    const resultBytes = await storeDID(getContract(), DID, doc);
    // const resultText = utf8Decoder.decode(resultBytes); // Decode the byte stream to a string
    // const result = JSON.parse(JSON.parse(resultText)); // Parse the string to a JSON object

    //const DID = `did:hlf:${result.org}_${result.methodID}`; // Create the DID from the result

    console.log(`DID ${DID} stored successfully!`); // Log the transaction
    res.status(200).send(doc); // Send the DID to the client
  } catch (error) {
    console.log(error);
    res.status(500).send("Error storing DID on the blockchain"); // Send an error message to the client
  }
  next();
});

module.exports = router;