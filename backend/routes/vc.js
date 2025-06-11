/*----------IMOPRTS----------*/
const { createVerify } = require("crypto");
const canonicalize = require("canonicalize");
const express = require("express");
const { startGateway, getGateway, getContract, getDIDDoc, getMapValue, storeMapping, storeDID} = require("../gateway");
const {envOrDefault} = require("../utility/gatewayUtilities");
const {createDID} = require("../utility/DIDUtils");
const {default: DIDDocumentBuilder} = require("../../utils/DIDDocumentBuilder");

router = express.Router();

const DIDchannelName = envOrDefault("CHANNEL_NAME", "didchannel"); //the name of the channel from the fabric-network
const VCchannelName = envOrDefault("CHANNEL_NAME", "vcchannel");
const DIDchaincodeName = envOrDefault("CHAINCODE_NAME", "DIDcc"); //the chaincode name used to interact with the fabric-network
const VCchaincodeName = envOrDefault("CHAINCODE_NAME", "VCcc");

/**
 * This function recieves a JSON of a
 * VC and it checks if the signature
 * is correct or not
 */
router.post("/verify", async (req, res) => {
  try {
    if (getGateway() == null) {
      await startGateway();
    }

    const VC = req.body;

    if (!VC) return res.status(400).send("VC required");

    const issuerDID = VC.unsignedVC.issuer;
    if (!issuerDID) return res.status(400).send("All VCs require an issuer field");

    // get issuer DID Document
    const issuerDoc = getDIDDoc(getContract(DIDchannelName,DIDchaincodeName), issuerDID);
    if (!issuerDoc) return res.status(500).send("The DID does not exist");

    //get its public key
    const publicKey = issuerDoc.verificationMethod[0].publicKeyPem;
    if (!publicKey) return res.status(400).send("This DID does not have a public key");

    // run the validate method
    const validity = await validateVC(VC, publicKey);
    if (validity == true) res.status(200).send("The VC is valid (it was issued by the issuer)");
    else res.status(200).send("The VC is not valid (it was not issued by the issuer)");
  } catch (error) {
    console.log(error);
    console.error("Error validating the VC");
    res.status(500).send("Error validating the VC");
  }
});

router.get("/getVCTypeMapping/:mappingKey", async (req, res) => {
  try {
    const VCType = req.params.mappingKey;

    if (getGateway() == null) await startGateway();

    console.log("Retrieving VC type mapping...");

    const mappingValueType = await getMapValue(getContract(VCchannelName,VCchaincodeName),VCType);

    console.log(`✅ Mapping for VC of type ${VCType} retrieved succesfully!`);
    res.status(200).json(mappingValueType);
  } catch (error) {
    console.error("❌ Error retrieving the mapping from blockchain:", error);
    res.status(500).send("Error querying the mapping from blockchain");
  }
});

router.post("/createMapping/:key/:value", async (req, res, next) => {
  try {
    // Check if the gateway is already started
    if (getGateway() == null) {
      await startGateway();
    }

    const  {mappingKey,mappingValue}  = req.params;
    if (!mappingKey) {
      return res.status(400).send("Key for the mapping is required");
    }
    if (!mappingValue){
      return res.status(400).send("Value for the mapping is required")
    }

    const result = await storeMapping(getContract(VCchannelName,VCchaincodeName), mappingKey, mappingValue);

    console.log(`Mapping for VC type ${mappingKey} with type ${mappingValue} stored successfully!`); // Log the transaction
    res.status(200).send("Mapping stored successfully"); // Send the DID to the client
  } catch (error) {
    console.log(error);
    res.status(500).send("Error storing mapping on the blockchain"); // Send an error message to the client
  }
});

/**
 * This function is only meant to verify the signature
 * of to make sure that it is valid. Later, the issuer will
 * be checked using the trustchain
 * @param {object} vc - The signed VC. It MUST include the proof field (and it should be a JSON)
 * @param {string} public
 * @returns {boolean} True if the VC is valid, false otherwise
 */
async function validateVC(vc, publicKey) {
  const { proof, ...rest } = vc; // separate the VC into the unsigned vc (rest) and the proof
  if (!proof || !proof.signatureValue) {
    throw new Error("Missing or invalid proof");
  }

  const canon = canonicalize(rest.unsignedVC); //serialize the VC (without the proof field)
  if (!canon) throw new Error("Faild to canonicalize VC");
  const verifier = createVerify("SHA256"); // hash the string representing the unsigned VC
  verifier.update(canon);
  verifier.end();

  return verifier.verify(publicKey, proof.signatureValue, "base64"); // verify that the signature is correct
}

module.exports = {
  validateVC,
  router,
};
