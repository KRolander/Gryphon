const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { subtle } = globalThis.crypto;

// Logger
const logger = require("./logger");
/**
 * This function is used to retrieve the public registry of
 * an organization
 * @param {string} url the service endpoint of an organization
 * @returns the public registry of the organization orgName
 */
async function fetchRegistry(url, correlationId = "unknown") {
  try {
    const response = await axios.get(url);
    const registry = response.data;
    console.log("Fetched registry:", registry);
    logger.info({
      action: "fetchRegistry",
      correlationId: correlationId,
      message: "Fetched successfully",
    });
    return registry;
  } catch (error) {
    if (error.response) {
      console.error("Error:", error.response.status, error.response.data);
      logger.warn({
        action: "fetchRegistry",
        correlationId: correlationId,
        message: `Error with status ${error.response.status}`,
      });
    } else {
      console.error("Network or server error:", error.message);
      logger.warn({
        action: "fetchRegistry",
        correlationId: correlationId,
        message: "Network or server error",
      });
    }
    return null;
  }
}

function isRoot(did) {
  const configPath = path.join(__dirname, "..", "config", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  return did === config.rootTAO.did;
}

// TESTING CONSTANTS AND FUNCTIONS
const universityTestPath = "./registries/university_test.json";
const moeTestPath = "./registries/MOE_test.json";

// Signing functionality for the tests
const encoder = new TextEncoder();
async function generateKeys() {
  const keyPair = await subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true, //used for being able to export the key
    ["sign", "verify"]
  );
  //both are arrayBuffers:
  const publicKeyBuf = await subtle.exportKey("spki", keyPair.publicKey); //with exportKey not encrypted, use SubtleCrypto.wrapKey() for encryption
  const privateKeyBuf = await subtle.exportKey("pkcs8", keyPair.privateKey); //maybe let the user encrypt

  // Return them as base64
  const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuf)));
  const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuf)));

  return { publicKey, privateKey };
}

async function importKey(key) {
  const keyBuffer = Uint8Array.from(atob(key), (c) => c.charCodeAt(0));
  return await subtle.importKey(
    "pkcs8",
    keyBuffer,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    ["sign"]
  );
}

async function sign(payload, privKey) {
  // Import the key
  const key = await importKey(privKey);

  // Encode the payload
  const dataBuffer = encoder.encode(payload);

  // Sign the data using ECDSA + SHA-256
  const signatureBuffer = await subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    key,
    dataBuffer
  );

  // Convert to base64
  return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
}

module.exports = {
  fetchRegistry,
  isRoot,
  universityTestPath,
  moeTestPath,
  generateKeys,
  sign,
};
