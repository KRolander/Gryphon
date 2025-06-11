/*----------IMOPRTS----------*/
const { createVerify } = require("crypto");
const canonicalize = require("canonicalize");
const express = require("express");

const { startGateway, getGateway, getContract, getDIDDoc, getMapValue, storeMapping, storeDID} = require("../gateway");
const {envOrDefault} = require("../utility/gatewayUtilities");
const axios = require("axios");
const { fetchRegistry } = require("../utility/VCUtils.js");


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

    if (!VC.type.includes("VerifiableCredential"))
      return res.status(400).send("The VC does not have the correct type");

    const issuerDID = VC.issuer;
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

router.post("/verifyTrustchain", async (req, res) => {
  try {
    if (getGateway() == null) {
      await startGateway();
    }
    const VC = req.body;

    if (!VC) return res.status(400).send("VC required");

    let currentVC = VC;
    let currentDID = currentVC.credentialSubject.id; // we get the DID of the user
    let userDID = currentVC.credentialSubject.id; // this is for a more clear description
    while (!isRoot(currentDID)) {
      if (!currentVC.type.includes("VerifiableCredential"))
        return res
          .status(400)
          .send(
            `The VC owned by ${currentDID} does not have the correct type(VerifiableCredential)`
          );
      // if the current DID is not the root, then we continue up the trustchain
      const issuerDID = currentVC.issuer;
      if (!issuerDID) return res.status(400).send("All VCs require an issuer field");

      // get issuer DID Document
      const issuerDoc = getDIDDoc(getContract(), issuerDID);
      if (!issuerDoc) return res.status(500).send("The DID does not exist");

      //get its public key
      const publicKey = issuerDoc.verificationMethod[0].publicKeyPem;

      if (!publicKey) return res.status(400).send("This DID does not have a public key");

      // run the validate method
      const validity = await validateVC(currentVC, publicKey);

      //console.log(currentVC);
      if (!validity) {
        if (currentDID == userDID)
          return res
              .status(200)
              .send(`The VC is invalid, as it was not signed by the issuer. ${currentDID}`);
        else
          return res
              .status(200)
              .send(
                  `The VC is invalid, there was a problem verifying it up the trustchain.${currentDID}`
              );
      } else {
        // Here is where the magic happens. There should be a function that retrieves
        // the map from the ledger and with that information it should choose the correct VC from
        // the public repository

        const issuerDoc = getDIDDoc(getContract(), issuerDID);
        const serviceArray = issuerDoc.service || [];
        const repoEndpoint = serviceArray.find((serv) => serv.id.endsWith("#vcs"));
        if (!repoEndpoint) {
          return res
              .status(500)
              .send("Issuer DID document does not contain a valid registry service.");
        }
        const endpoint = repoEndpoint.serviceEndpoint;
        const registry = await fetchRegistry(endpoint);

        let temp = "";
        if (currentVC.type.length == 2) {
          if (currentVC.type[0] == "VerifiableCredential") temp = currentVC.type[1];
          else temp = currentVC.type[0];
        } else return res.status(400).send("A VC requires 2 types to be valid");
        const vcType = temp; // this indicates the type of the VC
        const requiredPermission = await getMapValue(getContract(),vcType);

        //console.log(registry);
        //console.log(typeof registry);
        const issuerVCs = registry.get(issuerDID) || []; // this gets all the VCs that the issuer DID holds
        //console.log(map);
        //console.log(issuerVCs);
        const correctVC = issuerVCs.find((vc) => vc.type.some((t) => t === requiredPermission)); // if there is a VC with the correct permission it will be fond
        if (!correctVC)
          return res
            .status(200)
            .send(
              `The VC is invalid, an organization up the trustchain didn't have the required permission ${currentDID}`
            );
        currentVC = correctVC;
        currentDID = issuerDID;
      }
    }
    return res.status(200).send("The VC is valid");
  } catch (error) {
    console.log(error);
    console.error("Error validating the VC");
    res.status(500).send("Error validating the VC");
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

  const canon = canonicalize(rest); //serialize the VC (without the proof field)
  if (!canon) throw new Error("Faild to canonicalize VC");

  const verifier = createVerify("SHA256"); // hash the string representing the unsigned VC
  verifier.update(canon);
  verifier.end();

  return verifier.verify(publicKey, proof.signatureValue, "base64"); // verify that the signature is correct
}

function isRoot(did) {
  return did === "did:hlf:root";
}

module.exports = {
  validateVC,
  fetchRegistry,
  router,
};
