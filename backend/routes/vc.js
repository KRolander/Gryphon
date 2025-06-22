/*----------IMOPRTS----------*/
const { createVerify } = require("crypto");
const canonicalize = require("canonicalize");
const express = require("express");
const fs = require("fs");
const path = require("path");

const {
  startGateway,
  getGateway,
  getContract,
  getDIDDoc,
  getMapValue,
  storeMapping,
  storeDID,
  addDIDController,
} = require("../gateway");
const { envOrDefault } = require("../utility/gatewayUtilities");
const axios = require("axios");
const { fetchRegistry } = require("../utility/VCUtils.js");
const { isRoot } = require("../utility/VCUtils.js");
const router = express.Router();

// Logger
const logger = require("../utility/logger");
const { generateCorrelationId } = require("../utility/loggerUtils");

const DIDchannelName = envOrDefault("CHANNEL_NAME", "didchannel"); //the name of the channel from the fabric-network
const VCchannelName = envOrDefault("CHANNEL_NAME", "vcchannel");
const DIDchaincodeName = envOrDefault("CHAINCODE_NAME", "DIDcc"); //the chaincode name used to interact with the fabric-network
const VCchaincodeName = envOrDefault("CHAINCODE_NAME", "VCcc");

/**
 * This function receives a JSON of a
 * VC, and it checks if the signature
 * is correct or not
 */
router.post("/verify", async (req, res) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    if (getGateway() == null) {
      await startGateway();
    }

    const VC = req.body;

    if (!VC) {
      logger.warn({
        action: "POST /vc/verify",
        correlationId: correlationId,
        message: "VC missing",
      });
      return res.status(400).send("VC required");
    }

    if (!VC.type.includes("VerifiableCredential")) {
      logger.warn({
        action: "POST /vc/verify",
        correlationId: correlationId,
        message: "The VC does not have the correct type",
      });
      return res.status(400).send("The VC does not have the correct type");
    }

    const issuerDID = VC.issuer;
    if (!issuerDID) {
      logger.warn({
        action: "POST /vc/verify",
        correlationId: correlationId,
        message: "VC issuer field is missing",
      });
      return res.status(400).send("All VCs require an issuer field");
    }

    // get issuer DID Document
    const issuerDoc = getDIDDoc(getContract(DIDchannelName, DIDchaincodeName), issuerDID);
    if (!issuerDoc) {
      logger.warn({
        action: "POST /vc/verify",
        correlationId: correlationId,
        message: "The DID of the VC issuer doesn't exist",
      });
      return res.status(500).send("The DID does not exist");
    }

    //get its public key
    const publicKey = issuerDoc.verificationMethod[0].publicKeyPem;
    if (!publicKey) {
      logger.warn({
        action: "POST /vc/verify",
        correlationId: correlationId,
        message: "The DID of the VC issuer has no public key",
      });
      return res.status(400).send("This DID does not have a public key");
    }

    // run the validate method
    const validity = await validateVC(VC, publicKey, correlationId);
    if (validity == true) {
      logger.info({
        action: "POST /vc/verify",
        correlationId: correlationId,
        message: "The VC is valid",
      });
      res.status(200).send("The VC is valid (it was issued by the issuer)");
    } else {
      logger.info({
        action: "POST /vc/verify",
        correlationId: correlationId,
        message: "The VC is not valid",
      });
      res.status(200).send("The VC is not valid (it was not issued by the issuer)");
    }
  } catch (error) {
    const errorMessage = "Error validating the VC";
    logger.error({
      action: "POST /vc/verify",
      correlationId: correlationId,
      message: errorMessage,
    });
    console.error(errorMessage);
    res.status(500).send(errorMessage);
  }
});

router.get("/getVCTypeMapping/:mappingKey", async (req, res) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    const VCType = req.params.mappingKey;

    if (getGateway() == null) await startGateway();

    console.log("Retrieving VC type mapping...");

    const mappingValueType = await getMapValue(getContract(VCchannelName, VCchaincodeName), VCType);

    logger.info({
      action: "POST /vc/getVCTypeMapping",
      correlationId: correlationId,
      message: `Mapping for VC of type ${VCType} retrieved successfully!`,
    });
    console.log(`✅ Mapping for VC of type ${VCType} retrieved successfully!`);
    res.status(200).json(mappingValueType);
  } catch (error) {
    logger.error({
      action: "POST /vc/getVCTypeMapping",
      correlationId: correlationId,
      message: "Error querying the mapping from blockchain",
    });
    console.error("❌ Error retrieving the mapping from blockchain:", error);
    res.status(500).send("Error querying the mapping from blockchain");
  }
});

router.post("/createMapping/:key/:value", async (req, res, next) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    if (getGateway() == null) {
      await startGateway();
    }
    const { key: mappingKey, value: mappingValue } = req.params;
    if (!mappingKey) {
      logger.warn({
        action: "POST /vc/createMapping",
        correlationId: correlationId,
        message: "Key for the mapping is missing",
      });
      return res.status(400).send("Key for the mapping is required");
    }
    if (!mappingValue) {
      logger.warn({
        action: `POST /vc/createMapping/${mappingKey}`,
        correlationId: correlationId,
        message: "Value for the mapping is missing",
      });
      return res.status(400).send("Value for the mapping is required");
    }

    const result = await storeMapping(
      getContract(VCchannelName, VCchaincodeName),
      mappingKey,
      mappingValue
    );

    const successMessage = `Mapping for VC type ${mappingKey} with type ${mappingValue} stored successfully!`;
    logger.info({
      action: `POST /vc/createMapping/${mappingKey}`,
      correlationId: correlationId,
      message: successMessage,
    });
    console.log(successMessage);
    res.status(200).send("Mapping stored successfully"); // Send the DID to the client
  } catch (error) {
    const errorMessage = "Error storing mapping on the blockchain";
    logger.error({
      action: "POST /vc/createMapping",
      correlationId: correlationId,
      message: errorMessage,
    });
    console.log(error);
    res.status(500).send(errorMessage); // Send an error message to the client
  }
});

router.patch("/setRootTAO/:newRoot", async (req, res) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    if (getGateway() == null) {
      await startGateway();
    }

    const targetRoot = req.params.newRoot;

    try {
      await getDIDDoc(getContract(DIDchannelName, DIDchaincodeName), targetRoot);
    } catch (err) {
      const errorMessage = `There is no DID ${targetRoot}`;
      logger.warn({
        action: "PATCH vc/setRootTAO/:newRoot",
        correlationId: correlationId,
        message: errorMessage,
      });
      console.error(errorMessage);
      return res.status(400).send("No DID");
    }

    const pathToConfig = path.join(__dirname, "../config/config.json");

    const rootInConfig = fs.readFileSync(pathToConfig, "utf8");
    try {
      const JSONRoot = JSON.parse(rootInConfig);
      if (JSONRoot.rootTAO.did === targetRoot) {
        const warnMessage = "The provided DID is already a root";
        logger.warn({
          action: "PATCH vc/setRootTAO/:newRoot",
          correlationId: correlationId,
          message: warnMessage,
        });
        return res.status(400).send(warnMessage);
      }
    } catch (err) {}

    const dataToStore = { rootTAO: { did: targetRoot } };
    fs.writeFileSync(pathToConfig, JSON.stringify(dataToStore, null, 2), "utf8");

    const successMessage = `Root ${targetRoot} modified successfully!`;
    console.log(successMessage);
    logger.info({
      action: "PATCH /vc/setRootTAO/:newRoot",
      correlationId: correlationId,
      message: successMessage,
    });

    res.status(200).send(successMessage);
  } catch (error) {
    const errorMessage = "Error adding the new root";
    logger.error({
      action: "PATCH /vc/setRootTAO/:newRoot",
      correlationId: correlationId,
      message: errorMessage,
    });
    res.status(500).send(errorMessage);
  }
});

router.post("/verifyTrustchain", async (req, res) => {
  // TODO: In general add more checks to send to the user
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    if (getGateway() == null) {
      await startGateway();
    }
    const VC = req.body;

    if (!VC) {
      logger.warn({
        action: "POST /vc/verifyTrustchain",
        correlationId: correlationId,
        message: "VC missing",
      });
      return res.status(400).send("VC required");
    }

    let currentVC = VC;
    let currentDID = currentVC.credentialSubject.id; // we get the DID of the user
    let userDID = currentVC.credentialSubject.id; // this is for a more clear description

    while (!isRoot(currentDID)) {
      if (!currentVC.type.includes("VerifiableCredential")) {
        const warningMessage = `The VC owned by ${currentDID} does not have the correct type(VerifiableCredential)`;
        logger.warn({
          action: "POST /vc/verifyTrustchain",
          correlationId: correlationId,
          message: warningMessage,
        });
        return res.status(400).send(warningMessage);
      }
      // if the current DID is not the root, then we continue up the trustchain
      const issuerDID = currentVC.issuer;
      if (!issuerDID) {
        logger.warn({
          action: "POST /vc/verifyTrustchain",
          correlationId: correlationId,
          message: "VC issuer field is missing",
        });
        return res.status(400).send("All VCs require an issuer field");
      }

      // get issuer DID Document
      const issuerDoc = getDIDDoc(getContract(DIDchannelName, DIDchaincodeName), issuerDID);
      if (!issuerDoc) {
        logger.warn({
          action: "POST /vc/verifyTrustchain",
          correlationId: correlationId,
          message: "The DID of the VC issuer doesn't exist",
        });
        return res.status(500).send("The DID does not exist");
      }

      //get its public key
      // TODO: Change this access, as it does not work
      const publicKey = issuerDoc.verificationMethod[0].publicKeyPem;

      if (!publicKey) {
        logger.warn({
          action: "POST /vc/verifyTrustchain",
          correlationId: correlationId,
          message: "The DID of the VC issuer has no public key",
        });
        return res.status(400).send("This DID does not have a public key");
      }

      // run the validate method
      const validity = await validateVC(currentVC, publicKey);

      //console.log(currentVC);
      if (!validity) {
        if (currentDID == userDID) {
          const invalidMessage = `The VC is invalid, as it was not signed by the issuer. ${currentDID}`;
          logger.info({
            action: "POST /vc/verifyTrustchain",
            correlationId: correlationId,
            message: invalidMessage,
          });
          return res.status(200).send(invalidMessage);
        } else {
          const invalidMessage = `The VC is invalid, there was a problem verifying it up the trustchain. ${currentDID}`;
          logger.info({
            action: "POST /vc/verifyTrustchain",
            correlationId: correlationId,
            message: invalidMessage,
          });
          return res.status(200).send(invalidMessage);
        }
      } else {
        // Here is where the magic happens. There should be a function that retrieves
        // the map from the ledger and with that information it should choose the correct VC from
        // the public repository

        const issuerDoc = getDIDDoc(getContract(DIDchannelName, DIDchaincodeName), issuerDID);
        const serviceArray = issuerDoc.service || [];
        const repoEndpoint = serviceArray.find((serv) => serv.id.endsWith("#vcs"));
        if (!repoEndpoint) {
          const errorMessage = "Issuer DID document does not contain a valid registry service";
          logger.error({
            action: "POST /vc/verifyTrustchain",
            correlationId: correlationId,
            message: errorMessage,
          });
          return res.status(500).send(errorMessage);
        }
        const endpoint = repoEndpoint.serviceEndpoint;
        const registry = await fetchRegistry(endpoint, correlationId);

        let temp = "";
        if (currentVC.type.length == 2) {
          if (currentVC.type[0] == "VerifiableCredential") temp = currentVC.type[1];
          else temp = currentVC.type[0];
        } else {
          const errorMessage = "A VC requires 2 types to be valid";
          logger.error({
            action: "POST /vc/verifyTrustchain",
            correlationId: correlationId,
            message: errorMessage,
          });
          return res.status(400).send(errorMessage);
        }
        const vcType = temp; // this indicates the type of the VC
        const requiredPermission = await getMapValue(
          getContract(VCchannelName, VCchaincodeName),
          vcType
        );

        const issuerVCs = registry.get(issuerDID) || []; // this gets all the VCs that the issuer DID holds

        const correctVC = issuerVCs.find((vc) => vc.type.some((t) => t === requiredPermission)); // if there is a VC with the correct permission it will be fond
        if (!correctVC) {
          const invalidMessage = `The VC is invalid, an organization up the trustchain didn't have the required permission ${issuerDID}`;
          logger.info({
            action: "POST /vc/verifyTrustchain",
            correlationId: correlationId,
            message: invalidMessage,
          });
          return res.status(200).send(invalidMessage);
        }

        if (correctVC.credentialSubject.id !== issuerDID) {
          const invalidMessage = `There was a problem up the trustchain. It is possible that a third party took unauthorized control of another VC`;
          logger.info({
            action: "POST /vc/verifyTrustchain",
            correlationId: correlationId,
            message: invalidMessage,
          });
          return res.status(200).send(invalidMessage);
        }

        currentVC = correctVC;
        currentDID = issuerDID;
      }
    }
    logger.info({
      action: "POST /vc/verifyTrustchain",
      correlationId: correlationId,
      message: "The VC is valid",
    });
    return res.status(200).send("The VC is valid");
  } catch (error) {
    const errorMessage = "Error validating the VC";
    console.error(errorMessage);
    logger.error({
      action: "POST /vc/verifyTrustchain",
      correlationId: correlationId,
      message: errorMessage,
    });
    res.status(500).send(errorMessage);
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
async function validateVC(vc, publicKey, correlationId = "unknown") {
  const { proof, ...rest } = vc; // separate the VC into the unsigned vc (rest) and the proof
  if (!proof || !proof.signatureValue) {
    const errorMessage = "Missing or invalid proof";
    logger.warn({
      action: "validateVC",
      correlationId: correlationId,
      message: errorMessage,
    });
    throw new Error(errorMessage);
  }

  const canon = canonicalize(rest); //serialize the VC (without the proof field)
  if (!canon) {
    const errorMessage = "Failed to canonicalize VC";
    logger.error({
      action: "validateVC",
      correlationId: correlationId,
      message: errorMessage,
    });
    throw new Error(errorMessage);
  }
  const verifier = createVerify("SHA256"); // hash the string representing the unsigned VC
  verifier.update(canon);
  verifier.end();

  const isValid = verifier.verify(publicKey, proof.signatureValue, "base64"); // verify that the signature is correct

  if (isValid) {
    logger.info({
      action: "validateVC",
      correlationId: correlationId,
      message: "valid",
    });
  } else {
    logger.info({
      action: "validateVC",
      correlationId: correlationId,
      message: "not valid",
    });
  }

  return isValid;
}

module.exports = {
  validateVC,
  router,
};
