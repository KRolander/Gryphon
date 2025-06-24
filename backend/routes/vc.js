/*----------IMOPRTS----------*/
const { subtle } = globalThis.crypto;
const canonicalize = require("canonicalize");
const express = require("express");
const { saveRegistryFromMap, loadRegistryAsMap, addVC } = require("../../utils/publicRegistry");
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
    const issuerDoc = await getDIDDoc(getContract(DIDchannelName, DIDchaincodeName), issuerDID);
    if (!issuerDoc) {
      logger.warn({
        action: "POST /vc/verify",
        correlationId: correlationId,
        message: "The DID of the VC issuer doesn't exist",
      });
      return res.status(500).send("The DID does not exist");
    }

    //get its public key
    const publicKey = issuerDoc.verificationMethod[0].publicKey;
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
    // console.log(validity);
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
    // console.log(error);
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

/**
 * @route GET /vc/getVCTypeMapping/:mappingKey
 * @summary Handles getting a VC type value given VC type key
 * @description The method establishes a gateway connection if needed, then gets the value from the mapping of types
 * stored on the ledger as key:value, given a key
 *
 * @param {object} req.params - The parameters of the request
 * @param {string} req.params.mappingKey - The key to get the value for
 *
 * @returns {object} 200: A JSON object representing the value if it has been successfully retrieved
 * @returns {string} 500: "Error querying the mapping from blockchain" if there has been any error while getting the
 *                        value
 */
router.get("/getVCTypeMapping/:mappingKey", async (req, res) => {
  const correlationId = generateCorrelationId();
  req.params.correlationId = correlationId;
  try {
    const VCType = req.params.mappingKey;

    if (getGateway() == null) await startGateway();

    // console.log("Retrieving VC type mapping...");

    const mappingValueType = await getMapValue(getContract(VCchannelName, VCchaincodeName), VCType);

    logger.info({
      action: "POST /vc/getVCTypeMapping",
      correlationId: correlationId,
      message: `Mapping for VC of type ${VCType} retrieved successfully!`,
    });
    console.log(`✅ Mapping for VC of type ${VCType} retrieved successfully!`);
    return res.status(200).json(mappingValueType);
  } catch (error) {
    logger.error({
      action: "POST /vc/getVCTypeMapping",
      correlationId: correlationId,
      message: "Error querying the mapping from blockchain",
    });
    console.error("❌ Error retrieving the mapping from blockchain:", error);
    return res.status(500).send("Error querying the mapping from blockchain");
  }
});

/**
 * @route POST /vc/createMapping/:key/:value
 * @summary Handles creating a mapping for the VC types
 * @description The method establishes a gateway connection if needed, then stores on the ledger the mapping for the
 * VC types
 *
 * @param {object} req.params - The parameters of the request
 * @param {string} req.params.key - The VC type that represents the mapping key
 * @param {string} req.params.key - The VC type that represents the mapping value
 *
 * @returns {string} 400: "Key for the mapping is required" if the mapping key has an invalid value
 * @returns {string} 400: "Value for the mapping is required" if the mapping value has an invalid value
 * @returns {string} 200: "Mapping stored successfully" if the mapping has been successfully stored on the ledger
 * @returns {string} 500: "Error storing mapping on the blockchain" if there has been any error while storing the
 *                        mapping the ledger
 */
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
    // console.log(successMessage);
    res.status(200).send("Mapping stored successfully"); // Send the DID to the client
  } catch (error) {
    const errorMessage = "Error storing mapping on the blockchain";
    logger.error({
      action: "POST /vc/createMapping",
      correlationId: correlationId,
      message: errorMessage,
    });
    // console.log(error);
    res.status(500).send(errorMessage); // Send an error message to the client
  }
});

/**
 * @route PATCH /vc/setRootTAO/:newRoot
 * @summary Handles setting the root TAO
 * @description The method establishes a gateway connection if needed, then verifies if the provided root DID is on the
 * ledger. After that it reads the file in the config folder and it checks for duplicates or other file errors then
 * replaces the content with the provided DID.
 *
 * @param {object} req.params - The parameters of the request
 * @param {string} req.params.newRoot - The DID to be set as the root TAO
 *
 * @returns {string} 400: "No DID" if the provided DID is not on the ledger
 * @returns {string} 400: "The provided DID is already a root" if the provided DID is the same as the one in the config
 *                   file
 * @returns {string} 200: "Root ${targetRoot} modified successfully!" if the provided DID was written in the config file
 * @returns {string} 500: "Error adding the new root" if there has been any error while adding the root TAO
 */
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

/**
 * @route POST /vc/verifyTrustchain
 * @summary Handles verifying the validity of a VC by checking the trustchain
 * @description: The method takes a VC as input and recursively verifies its validity. First, we retrieve the DID
 * document of the issuer and we verify the signature from our current VC. If the signature is incorrect, we stop the
 * process declaring the VC as invalid. Otherwise, we retrieve the public registry of the issuer. The issuer should
 * have a VC that allows it to issue the current VC type. An issuer can issue a type of VC if the mapping exists on the
 * blockchain (eg. if on the blockchain the mapping Diploma:DiplomaIssuing exists, in order for the issuer to issue VCs
 * with type Diploma, they would need a VC with the type DiplomaIssuing). If we don't find the necessary VC in the
 * registry we declare the current VC as invalid, otherwise, we verify the VC from the issuer. This process continues
 * recursively until we arrive at the rootTAO, an inherently trusted authority set up previously.
 *
 * @param {object} req.body - The VC we want to verify
 *
 * @returns {string} 400: "VC required" if the body of the request contains no VC
 * @returns {string} 400: "The VC owned by ${currentDID} does not have the correct type(VerifiableCredential)"
 *                        if the currentDID does not have the VerifiableCredential type
 * @returns {string} 500: "The DID does not exist" if the issuer DID does not exist on the blockchain
 * @returns {string} 400: "This DID does not have a public key" if the DID document of the issuer does not have a
 *                        public key
 * @returns {string} 200: "The VC is invalid, as it was not signed by the issuer." if the signature of the VC passed as
 *                        argument is invalid
 * @returns {string} 200: "The VC is invalid, there was a problem verifying it up the trustchain." if the signature of
 *                        any of the VCs from the trustchain is invalid
 * @returns {string} 500: "Issuer DID document does not contain a valid registry service" if the issuer DID does not
 *                        have a service endpoint pointing to its public registry
 * @returns {string} 400: "A VC requires 2 types to be valid" if any VC up the trustchain doesn't have the 2 required
 *                        types (VerifiableCredential and another one)
 * @returns {string} 200: "The VC is invalid, an organization up the trustchain didn't have the required permission"
 *                        if any of the organizations up the trustchain doesn't have the necessary VC in their public
 *                        registry
 * @returns {string} 200: "There was a problem up the trustchain. It is possible that a third party took unauthorized
 *                        control of another VC" if one of the VCs up the trustchain is a malicious user
 * @returns {string} 200: "The VC is valid" if the process of verifying the VC concludes and the VC is valid
 */
router.post("/verifyTrustchain", async (req, res) => {
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
      // console.log("linia 250");
      // get issuer DID Document
      const issuerDoc = await getDIDDoc(getContract(DIDchannelName, DIDchaincodeName), issuerDID);
      if (!issuerDoc) {
        logger.warn({
          action: "POST /vc/verifyTrustchain",
          correlationId: correlationId,
          message: "The DID of the VC issuer doesn't exist",
        });
        return res.status(500).send("The DID does not exist");
      }
      // console.log("linia 261");
      //get its public key
      const publicKey = issuerDoc.verificationMethod[0].publicKey;

      if (!publicKey) {
        logger.warn({
          action: "POST /vc/verifyTrustchain",
          correlationId: correlationId,
          message: "The DID of the VC issuer has no public key",
        });
        return res.status(400).send("This DID does not have a public key");
      }
      // console.log("Before validating linia 273");
      // run the validate method
      const validity = await validateVC(currentVC, publicKey);
      // console.log("Linia 276 " + validity);
      if (!validity) {
        if (currentDID === userDID) {
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

        const issuerDoc = await getDIDDoc(getContract(DIDchannelName, DIDchaincodeName), issuerDID);
        const serviceArray = issuerDoc.service || [];
        const repoEndpoint = serviceArray.find((serv) => serv.id.endsWith("#vcs"));
        // console.log("Endpoint " + repoEndpoint);
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

        // console.log("Registry " + registry);

        const map = new Map(Object.entries(registry));

        // console.log("After line 320 \n\n\n\n\n\n");
        // console.log(map);

        let temp = "";
        if (currentVC.type.length === 2) {
          if (currentVC.type[0] === "VerifiableCredential") temp = currentVC.type[1];
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
        // console.log("Getting map value");
        const requiredPermission = await getMapValue(
          getContract(VCchannelName, VCchaincodeName),
          vcType
        );

        const issuerVCs = map.get(issuerDID) || []; // this gets all the VCs that the issuer DID holds
        // console.log(issuerVCs);

        const correctVC = issuerVCs.find((vc) => vc.type.some((t) => t === requiredPermission)); // if there is a VC with the correct permission it will be fond
        // console.log(correctVC);
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
    console.log("VC is valid");
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

// Import ECDSA public key in SPKI format (base64)
async function importPublicKey(base64Key) {
  const keyBuffer = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return subtle.importKey(
    "spki",
    keyBuffer,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["verify"]
  );
}

// Verify signature using crypto.subtle
async function verifyVC(payload, base64Signature, base64PublicKey) {
  // Import public key
  const publicKey = await importPublicKey(base64PublicKey);

  // Encode payload to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);

  // Convert base64 signature to ArrayBuffer
  const signature = Uint8Array.from(atob(base64Signature), (c) => c.charCodeAt(0));

  // Verify the signature
  return subtle.verify(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    publicKey,
    signature,
    data
  );
}

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
  // const verifier = createVerify("SHA256"); // hash the string representing the unsigned VC
  // verifier.update(canon);
  // verifier.end();

  // const isValid = verifier.verify(publicKey, proof.signatureValue, "base64"); // verify that the signature is correct

  const isValid = await verifyVC(canon, proof.signatureValue, publicKey); // verify that the signature is correct
  // console.log("signature is valid " + isValid);
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
