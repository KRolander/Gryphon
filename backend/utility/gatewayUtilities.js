/* ------------------ IMPORTS ------------------*/
const path = require("path"); // Path is used to resolve the path to the organization's connection profile

/* ------------------ CONFIG ------------------*/
/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key, defaultValue) {
  return process.env[key] || defaultValue;
}

// Path to crypto materials.
const cryptoPath = envOrDefault(
  "CRYPTO_PATH",
  path.resolve(
    __dirname, // demo-hyperledger-fabric/demo-backend/src/utility
    "..", // demo-hyperledger-fabric/demo-backend/src
    "..", // demo-hyperledger-fabric/demo-backend
    "..", // demo-hyperledger-fabric
    "fabric-samples", // demo-hyperledger-fabric/faric-samples
    "test-network",
    "organizations",
    "peerOrganizations",
    "org1.example.com"
  )
).trim();

// Path to user private key directory.
const keyDirectoryPath = envOrDefault(
  "KEY_DIRECTORY_PATH",
  path.resolve(cryptoPath, "users", "User1@org1.example.com", "msp", "keystore")
);

// Path to user certificate directory.
const certDirectoryPath = envOrDefault(
  "CERT_DIRECTORY_PATH",
  path.resolve(
    cryptoPath,
    "users",
    "User1@org1.example.com",
    "msp",
    "signcerts"
  )
);

// Path to peer tls certificate.
const tlsCertPath = envOrDefault(
  "TLS_CERT_PATH",
  path.resolve(cryptoPath, "peers", "peer0.org1.example.com", "tls", "ca.crt")
);

module.exports = {
  envOrDefault,
  keyDirectoryPath,
  certDirectoryPath,
  tlsCertPath,
};
