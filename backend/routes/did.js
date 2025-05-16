/* ------------------ IMPORTS ------------------*/
// core
const express = require("express");
const { TextDecoder } = require("util"); // TextDecoder is used to decode the byte array from the blockchain => we get bytes from the blockchain

// gateway
const {
  startGateway,
  getGateway,
  storeDID,
  getContract,
} = require("../gateway/gateway");
/* ------------------ CONFIG ------------------*/
const router = express.Router();
const utf8Decoder = new TextDecoder();

router.post("/create", async (req, res, next) => {

  try {
    // Check if the gateway is already started
    if (getGateway() == null) {
      await startGateway();
    }

    // Decode the result
    const resultBytes = await storeDID(getContract());
    const resultText = utf8Decoder.decode(resultBytes); // Decode the byte stream to a string
    const result = JSON.parse(JSON.parse(resultText)); // Parse the string to a JSON object

    const DID = `did:hlf:${result.org}_${result.methodID}`; // Create the DID from the result

    console.log(`DID ${DID} stored successfully!`); // Log the transaction
    res.status(200).send(DID); // Send the DID to the client
  } catch (error) {
    console.log(error);
    res.status(500).send("Error storing DID on the blockchain"); // Send an error message to the client
  }
  next();
});

module.exports = router;