/**
 * This module is used to create the gateway and connect the backend to the 
 * chaincode.
 * The gateway is a way transfer information recieved by the backend to the blockchain
 * The code was taken from the hyperledger fabric gateway example
 */

//IMPORTS
const crypto = require("crypto"); // Used for generating cryptographic keys
const path = require("path"); // Used to resolve the path to the organization's profile
const fs = require("fs/promises");
const { TextDecoder } = require("util"); // Used to decode the byte arrays from the blockchain
const { v4: uuidv4 } = require("uuid");

const grpc = require("@grpc/grpc-js"); // gRPC is used to communicate between the gateway and the fabric network
const { connect, hash, signers } = require("@hyperledger/fabric-gateway"); // SDK used to interact with the fabric network

const {
    envOrDefault,
    keyDirectoryPath,
    certDirectoryPath,
    tlsCertPath
} = require("./utility/gatewayUtilities"); 

//CONFIG
const channelName = envOrDefault("CHANNEL_NAME", "mychannel"); //the name of the channel from the fabric-network
const chaincodeName = envOrDefault("CHAINCODE_NAME", "basic"); //the chaincode name used to interact with the fabric-network
const mspId = envOrDefault("MSP_ID", "Org1MSP");

// Gateway peer endpoint
const peerEndpoint = envOrDefault("PEER_ENDPOINT", "localhost:7051");

// Gateway peer SSL host name
const peerHostAlias = envOrDefault("PEER_HOST_ALIAS", "peer0.org1.example.com"); //connecting to localhost would cause the TLS handshake to fail.
                                                                                //therefore, this commnad tells the SDK to treat localhost as peer0

const utf8Decoder = new TextDecoder();
let gateway = null;
let network = null;
let contract = null;

//GATEWAY

//Initializes the gateway that will be used for the connection
async function  startGateway() {
    if (gateway) {
        return;
    }

    const client  = await newGRPCConnection(); // Create a new gRPC connection

    gateway = connect({
        client,
        identity: await newIdentity(), // Create a new identity
        signer: await newSigner(), // Create a new signer
        hash: hash.sha256,
        // Default timeouts for different gRPC calls
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

  try {
    // Create the network
    network = gateway.getNetwork(channelName); // Get the network from the gateway

    // Retrieve the contract from the network
    contract = network.getContract(chaincodeName); // Get the contract from the network
  } catch (error) {
    console.error("Error starting gateway:", error); // Log the error
  }
}



// Initializes the client
async function newGRPCConnection() {
    const tlsRootCert = await fs.readFile(tlsCertPath); // Read the TLS certificate
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);

    return new grpc.Client(peerEndpoint, tlsCredentials, {
    "grpc.ssl_target_name_override": peerHostAlias,
    });
  }

  // Creates a new identity
  async function newIdentity() {
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
  }

  // Reads the first file in the directory
  async function getFirstDirFileName(dirPath) {
    const files = await fs.readdir(dirPath);
    const file = files[0];
    if (!file) {
      throw new Error(`No files in directory: ${dirPath}`);
    }
    return path.join(dirPath, file);
  }

  // Create a new signer
  async function newSigner() {
  const keyPath = await getFirstDirFileName(keyDirectoryPath);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

async function storeDID(contract, DID, DIDDocument) { //make sure the contract valid
    const response = contract.submitTransaction('storeDID', DID, DIDDocument);
    return parseResponse(response);
}

async function getDID(contract, DID) {
    const response = contract.evaluateTransaction('getDIDDoc', DID);
    return parseResponse(response);
}


//TO BE PUT IN THE UTILS FOLDER ONCE WE HAVE ONE
async function parseResponse(response) {
    const responseJson = utf8Decoder.decode(response);
    const result = JSON.parse(responseJson);
    return result;
}

function getGateway() {
  return gateway;
}

function getContract() {
  return contract;
}

module.exports = {
  startGateway,
  getGateway,
  storeDID,
  getContract,
};