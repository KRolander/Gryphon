/**
 * This module is used to create the gateway and connect the backend to the
 * chaincode.
 * The gateway is a way transfer information received by the backend to the blockchain
 * The code was taken from the hyperledger fabric gateway example
 */

//IMPORTS
const crypto = require("crypto"); // Used for generating cryptographic keys
const path = require("path"); // Used to resolve the path to the organization's profile
const fs = require("fs/promises");
const { TextDecoder } = require("util"); // Used to decode the byte arrays from the blockchain
const { v4: uuidv4 } = require("uuid");
const stringify = require("fast-json-stable-stringify");
const sortKeysRecursive = require("sort-keys-recursive");

const grpc = require("@grpc/grpc-js"); // gRPC is used to communicate between the gateway and the fabric network
const { connect, hash, signers } = require("@hyperledger/fabric-gateway"); // SDK used to interact with the fabric network

const {
  envOrDefault,
  keyDirectoryPath,
  certDirectoryPath,
  tlsCertPath,
} = require("./utility/gatewayUtilities");
//const DIDDocument = require("../chaincode/types/DIDDocument.js");

//CONFIG
const mspId = envOrDefault("MSP_ID", "Org1MSP");

// Gateway peer endpoint
const peerEndpoint = envOrDefault("PEER_ENDPOINT", "peer0.org1.example.com:7051");

// Gateway peer SSL host name
const peerHostAlias = envOrDefault("PEER_HOST_ALIAS", "peer0.org1.example.com"); //connecting to localhost would cause the TLS handshake to fail.
//therefore, this command tells the SDK to treat localhost as peer0

const utf8Decoder = new TextDecoder();
let gateway = null;
let network = null;
let contract = null;

//GATEWAY
/**
 * @summary Initializes the gateway instance that will be used for the connection for both VCs and DIDs
 *
 * @returns {Promise<void>} - The method ends when the gateway is initialized
 */
async function startGateway() {
  const client = await newGRPCConnection(); // Create a new gRPC connection

  gateway = connect({
    client,
    identity: await newIdentity(), // Create a new identity
    signer: await newSigner(), // Create a new signer
    hash: hash.sha256,
    // Default timeouts for different gRPC calls (Fabric operations)
    evaluateOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    endorseOptions: () => {
      return { deadline: Date.now() + 15000 }; // 15 seconds
    },
    submitOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    commitStatusOptions: () => {
      return { deadline: Date.now() + 60000 }; // 1 minute
    },
  });
}

/**
 * @summary Initializes the client
 * @returns {Promise<Client>} - The gRPC Client instance
 */
async function newGRPCConnection() {
  const tlsRootCert = await fs.readFile(tlsCertPath); // Read the TLS certificate
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);

  return new grpc.Client(peerEndpoint, tlsCredentials, {
    "grpc.ssl_target_name_override": peerHostAlias,
  });
}

/**
 * @summary Function used to get a Fabric identity for the gateway connection, reading a specific file
 *
 * @returns {Promise<{mspId: string, credentials: Buffer<ArrayBufferLike>}>} - An object containing the MSP id and the
 *                                                                             certificate in a PEM format
 */
async function newIdentity() {
  const certPath = await getFirstDirFileName(certDirectoryPath);
  const credentials = await fs.readFile(certPath);
  return { mspId, credentials };
}

/**
 * @summary Helper method to get the path to the first file in a directory
 *
 * @param {string} dirPath - The path for the directory to read
 * @returns {Promise<string>} - Returns the path to the first file of the directory
 * @throws {Error} - If the directory has no files
 */
async function getFirstDirFileName(dirPath) {
  const files = await fs.readdir(dirPath);
  const file = files[0];
  if (!file) {
    throw new Error(`No files in directory: ${dirPath}`);
  }
  return path.join(dirPath, file);
}

/**
 * @summary Method used to create a new Signer
 * @description It takes the private key of the user for which the path is provided and parses it to a KeyObject to be
 *              used for the signing implementation
 * @returns {Promise<(digest: Uint8Array) => Promise<Uint8Array>>} - A signing implementation
 */
async function newSigner() {
  const keyPath = await getFirstDirFileName(keyDirectoryPath);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

/**
 * @summary Function used for storing a DID and its document on the ledger
 * @description The function communicates with the DID chaincode ("storeDID" transaction) for storing. It ensures a
 *              deterministic structure of the DID document then sends the transaction to the chaincode via the contract
 *
 * @param {Contract} contract - The contract used for interacting with the DID chaincode
 * @param {string} DID - The DID to store on the ledger
 * @param {object} DIDDoc - The JSON object representing the DID document to be stored on the ledger
 * @returns {Promise<string>} - A stringified JSON object representation of the DID document
 */
async function storeDID(contract, DID, DIDDoc) {
  const DIDDocStr = stringify(sortKeysRecursive(DIDDoc));
  await contract.submitTransaction("storeDID", stringify(DID), DIDDocStr);
  return DIDDocStr;
}

/**
 * @summary Function used for storing a DID and its DID Data structure on the ledger
 * @description The function communicates with the DID chaincode ("storeDID_dataStruct" transaction) for storing. It ensures a
 *              deterministic structure of the DID Data structure then sends the transaction to the chaincode via the contract
 *
 * @param {Contract} contract - The contract used for interacting with the DID chaincode
 * @param {string} DID - The DID to store on the ledger
 * @param {object} DID_dataStruct - The JSON object representing the DID Data structure to be stored on the ledger
 * @returns {Promise<string>} - A stringified JSON object representation of the DID Data structure
 */
async function storeDID_dataStruct(contract, DID, DID_dataStruct) {
  const DID_dataStructStr = stringify(sortKeysRecursive(DID_dataStruct));
  await contract.submitTransaction("storeDIDdataStruct", stringify(DID), DID_dataStructStr);
  return DID_dataStructStr;
}

/**
 * @summary Function used for getting a DID document from the ledger
 * @description The function communicates with the DID chaincode ("getDIDDoc" transaction) for retrieving the DID
 *              document for the provided DID
 *
 * @param {Contract} contract - The contract used for interacting with the DID chaincode
 * @param {string} DID - The DID to get the DID document for
 * @returns {Promise<object>} - The JSON object representation of the DIDDocument
 */
async function getDIDDoc(contract, DID) {
  const response = await contract.evaluateTransaction("getDIDDoc", stringify(DID));
  return parseResponse(response);
}

/**
 * @summary Function used for getting a DID data structure from the ledger
 * @description The function communicates with the DID chaincode ("getDIDDataStructure" transaction) for retrieving the DID
 *              data strucutre for the provided DID
 *
 * @param {Contract} contract - The contract used for interacting with the DID chaincode
 * @param {string} DID - The DID to get the DID data structure for
 * @returns {Promise<object>} - The JSON object representation of the DIDDocument
 */
async function getDID_dataStruct(contract, DID) {
  const response = await contract.evaluateTransaction("getDIDDataStructure", stringify(DID));
  return parseResponse(response);
}



/**
 * @summary Function used to update a DID and its DID Data structure on the ledger
 * @description The function communicates with the DID chaincode ("updateDID" transaction) for storing. It ensures a
 *              deterministic structure of the DID Data structure then sends the transaction to the chaincode via the contract
 *
 * @param {Contract} contract - The contract used for interacting with the DID chaincode
 * @param {string} DID - The DID to store on the ledger
 * @param {object} DID_dataStruct - The JSON object representing the DID Data structure to be updated on the ledger
 * the fields DIDUpdateTimestamp - will be updated automatically, Controller - can be updated, and DC_flag_version - can be updated. 
 * @returns {Promise<string>} - A stringified JSON object representation of the DID Data structure
 */
async function updateDID_dataStruct(contract, DID, DID_dataStruct) {
  const DID_dataStructStr = stringify(sortKeysRecursive(DID_dataStruct));
  const response = await contract.submitTransaction("updateDID", stringify(DID), DID_dataStructStr);
  return parseResponse(response);
}





/**
 * @summary Function used for updating the DID document of a provided DID
 * @description The function communicates with the DID chaincode ("updateDIDDoc" transaction) for updating the document.
 *              It ensures a deterministic structure of the DID document then sends the transaction to the chaincode via
 *              the contract
 *
 * @param {Contract} contract - The contract used for interacting with the DID chaincode
 * @param {string} DID - The DID to modify the document for
 * @param {object} DIDDoc - The JSON object representing the DID document to be modified
 * @returns {Promise<object>} - A JSON object with the value of the transaction
 */
//TODO currently this function is used for updating the service as well so the name is misleading, might be changed
// after refactoring
async function addDIDController(contract, DID, DIDDoc) {
  const DIDDocStr = stringify(sortKeysRecursive(DIDDoc));
  const response = await contract.submitTransaction("updateDIDDoc", stringify(DID), DIDDocStr);
  return parseResponse(response);
}

/**
 * @summary Function used for deleting a DID and its document from the ledger
 * @description The function communicates with the DID chaincode ("deleteDID" transaction) for deleting the DID and its
 *              document
 *
 * @param {Contract} contract - The contract used for interacting with the DID chaincode
 * @param {string} DID - The DID to be deleted
 */
async function deleteDID(contract, DID) {
  await contract.submitTransaction("deleteDID", DID);
}

/**
 * @summary Function used for getting a mapping value from the ledger
 * @description The function communicates with the VC chaincode ("getMapValue" transaction) for getting the VC type
 *              value parameter of the type mapping from the ledger
 *
 * @param {Contract} contract - The contract used for interacting with the VC chaincode
 * @param {string} mapKey - The key in the mapping to get the value for
 * @returns {Promise<string>} - The value of the mapping
 */
async function getMapValue(contract, mapKey) {
  const response = await contract.evaluateTransaction("getMapValue", mapKey);
  return utf8Decoder.decode(response);
}

/**
 * @summary Function used for storing a key:value mapping on the ledger
 * @description The function communicates with the VC chaincode ("storeMapping" transaction) for storing the provided
 *              key and value as a mapping on the ledger
 *
 * @param {Contract} contract - The contract used for interacting with the VC chaincode
 * @param {string} mapKey - The key in the mapping
 * @param {string} mapValue - The value in the mapping
 * @returns {Promise<Object>} - A JSON object with the value of the transaction
 */
async function storeMapping(contract, mapKey, mapValue) {
  const response = await contract.submitTransaction("storeMapping", mapKey, mapValue);
  return utf8Decoder.decode(response);
}

/**
 * @summary Helper method for parsing a UTF-8-encoded data to a JSON object
 *
 * @param {ArrayBufferLike} response - The data to be decoded and parsed
 * @returns {Promise<object>} - A JSON representation of the given input
 */
async function parseResponse(response) {
  const responseJson = utf8Decoder.decode(response);
  const result = JSON.parse(responseJson);
  return result;
}

/**
 * @summary Helper method to get the initialized gateway instance.
 * @returns {Gateway} - The Gateway instance or null if the gateway has not been initialized
 */
function getGateway() {
  return gateway;
}

/**
 * @summary Helper method to get a Contract instance for interacting with the given chaincode on the given channel
 *
 * @param {string} channel - The name of the Fabric channel
 * @param {string} chaincode - The name of the deployed chaincode
 * @returns {Contract} - A Contract instance
 */
function getContract(channel, chaincode) {
  const network = gateway.getNetwork(channel);
  return network.getContract(chaincode);
}

/**
 * @summary Helper method to get a Fabric Network object
 *
 * @param {string} channel - The name of the Fabric channel
 * @returns {Network} - A Newtwork instance representing the Fabric channel
 */
function getNetwork(channel) {
  return gateway.getNetwork(channel);
}

module.exports = {
  startGateway,
  getGateway,
  storeDID,
  storeDID_dataStruct,
  updateDID_dataStruct,
  getContract,
  getNetwork,
  getDIDDoc,
  getDID_dataStruct,
  addDIDController,
  deleteDID,
  getMapValue,
  storeMapping,
};
