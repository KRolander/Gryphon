/*----------IMPORTS----------*/
const { createVerify } = require("crypto");
const canonicalize = require("canonicalize");
const express = require("express");
const { startGateway, getGateway, getContract, getDIDDoc } = require("../gateway");

// Logger
const logger = require("../utility/logger");
const { generateCorrelationId } = require("../utility/loggerUtils");

router = express.Router();

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

    const issuerDID = VC.unsignedVC.issuer;
    if (!issuerDID) {
      logger.warn({
        action: "POST /vc/verify",
        correlationId: correlationId,
        message: "VC issuer field is missing",
      });
      return res.status(400).send("All VCs require an issuer field");
    }

    // get issuer DID Document
    const issuerDoc = getDIDDoc(getContract(), issuerDID);
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
    const validity = validateVC(VC, publicKey, correlationId);
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

/**
 * This function is only meant to verify the signature
 * of to make sure that it is valid. Later, the issuer will
 * be checked using the trustchain
 * @param {object} vc - The signed VC. It MUST include the proof field (and it should be a JSON)
 * @param {string} public
 * @param {string} [correlationId=unknown] - ID of the current event, used for logging
 * @returns {boolean} True if the VC is valid, false otherwise
 */
function validateVC(vc, publicKey, correlationId = "unknown") {
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

  const canon = canonicalize(rest.unsignedVC); //serialize the VC (without the proof field)
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
