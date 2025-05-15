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
} = require("../utility/gatewayUtilities"); // TODO Implement gatewayUtilities

//CONFIG
const channelName = envOrDefault("CHANNEL_NAME", "mychannel"); //the name of the channel from the fabric-network
const chaincodeName = envOrDefault("CHAINCODE_NAME", "basic"); //the chaincode name used to interact with the fabric-network
const mspId = envOrDefault("MSP_ID", "Org1MSP");

// Gateway peer endpoint
const peerEndpoint = envOrDefault("PEER_ENDPOINT", "localhost:7051");

// Gateway peer SSL host name
const peerHostAlias = envOrDefault("PEER_HOST_ALIAS", "peer0.org1.example.com");

const utf8Decoder = new TextDecoder();
let gateway = null;
let network = null;
let contract = null;