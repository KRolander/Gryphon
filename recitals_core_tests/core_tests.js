const axios = require('axios');
const bs58 = require("bs58");
const stringify = require("fast-json-stable-stringify");
const sortKeysRecursive = require("sort-keys-recursive");

const crypto = require("crypto");

var hash = "sha256";
var curve = "secp256k1";


/**
 * @summary Creates a new DID string
 * @description The created DID starts with "did:hlf:" then it appends to this a randomly generated 16 bytes long
 * string that is base58-encoded
 * @returns {Promise<string>} A string representing a DID starting with "did:hlf:"
 */
async function createDIDstring() {
    const randomString = bs58.default.encode(Buffer.from(crypto.randomBytes(16)));
    return "did:hlf:" + randomString;
}


function convertArrayBufferToHexaDecimal(buffer) {
    var data_view = new DataView(buffer)
    var iii, len, hex = '', c;

    for (iii = 0, len = data_view.byteLength; iii < len; iii += 1) {
        c = data_view.getUint8(iii).toString(16);
        if (c.length < 2) {
            c = '0' + c;
        }

        hex += c;
    }

    return hex;
}
/**
 * @summary calls POST /did/createDID
 * @description  DID Issuer (external) service issues an DID data structure which will be stored on the DLT
 * DID data structure: (JSON)
 *    - DID (string)
 *    - DID public key or Controller's public key
 *    - Controller 
 *    - Decentralized flag version
 *    - Metadata 
 *        - DID Creation Timestamp
 *        - DID Update Timestamp
 *        - Action [CreateDID, UpdateDID]
 *        - Signature :  | DID Creation/Update Timestamp & Action |
 * 
 * @returns {string} 400: The DID data structure is not complete: missing elements {to be specified}
 * @returns {string} 200: The string DID data structure: (JSON) if everything went well
 * @returns {string} 500: "Error storing DID on the blockchain" if DID creation fails for any reason
 *@returns {string} 501: "Error creating this DID on the blockchain is not possible since the DID already exists. You can Update it but not re-create." 
 */

async function testCreateDID() {

    let metadata = {
        DIDCreationTimestamp: "",
        DIDUpdateTimestamp: "NA", // Since it is a creation
        Action: "CreateDID",
        Signature: ""
    }

    let DID_Data_Structure = {
        DID: "",
        DID_PubKey: "",
        Controller: "did:hlf:6KMWr3acfcqnLUzGCA3jMw",
        DC_flag_version: "v1.0",
        Metadata: metadata
    }

    // Create a random DID string
    DID_Data_Structure.DID = await createDIDstring();
    const firstDID = DID_Data_Structure.DID;

    // DID issuer will ask for the time stamp before creation ofthe DID data strucure
    DID_Data_Structure.Metadata.DIDCreationTimestamp = new Date().toISOString()

    // DID issuer will generate a key pair corresponding to the DID to store
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: curve,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    DID_Data_Structure.DID_PubKey = publicKey.toString("hex")


    // DID issuer will compute the signature of  | DID Creation/Update Timestamp & Action |
    const sign = crypto.createSign(hash);
    const message = DID_Data_Structure.Metadata.Action + DID_Data_Structure.Metadata.DIDCreationTimestamp
    sign.write(message);
    sign.end();

    var signature = sign.sign(privateKey, 'hex');

    DID_Data_Structure.Metadata.Signature = signature

    // Smart Contract - Chaincode will verify with that  
    // const verify = crypto.createVerify(hash);
    // verify.write(message);
    // verify.end();
    // if (!verify.verify(publicKey, signature, 'hex')) {
    //     console.log("Signature is not valid!")
    // } else {
    //     console.log("Signature is valid!")

    // }

    // Test of a successful DID creation
    try {
        const response = await axios.post('http://localhost:3000/did/createDIDDataStruct', {
            publicKey: DID_Data_Structure.DID_PubKey,
            DIDDataStructure: DID_Data_Structure
        });

        console.log('------------------------------------------------------');
        console.log('[Successful DID Creation]:');
        console.log('------------------------------------------------------');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        console.log('------------------------------------------------------');

    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }

    console.log("\n\n");

    // Test of an unsuccessful DID creation
    // Expected error : Missing field from the DID Structure 
    // DID_Data_Structure.DID = ""
    // try {
    //     const response = await axios.post('http://localhost:3000/did/createDIDDataStruct', {
    //         publicKey: DID_Data_Structure.DID_PubKey,
    //         DIDDataStructure: DID_Data_Structure
    //     });

    //     console.log('Status:', response.status);
    //     console.log('Data:', response.data);
    // } catch (err) {
    //     console.log('------------------------------------------------------');
    //     console.log('[Unsuccessful DID Creation]:');
    //     console.log('------------------------------------------------------');
    //     console.error('Error:', err.response ? err.response.data : err.message);
    //     console.log('------------------------------------------------------');

    // }
}

async function testCreateDIDDoc() {

    // Test of a successful DID creation
    try {
        const response = await axios.post('http://localhost:3000/did/DIDcreate', {
            publicKey: "myPublicKey", DIDDataStructure : "DIDStructure"
        });

        console.log('------------------------------------------------------');
        console.log('[Successful DID Creation]:');
        console.log('------------------------------------------------------');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        console.log('------------------------------------------------------');

    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }

}


async function testJsonConversions() {

    // Construct DID Data - mocks the DID issuer (external) service

    let metadata = {
        DIDCreationTimestamp: "",
        DIDUpdateTimestamp: "NA", // Since it is a creation
        Action: "CreateDID",
        Signature: ""
    }

    let DID_Data_Structure = {
        DID: "",
        DID_PubKey: "",
        Controller: "did:hlf:6KMWr3acfcqnLUzGCA3jMw",
        DC_flag_version: "v1.0",
        Metadata: metadata
    }

    // Create a random DID string
    DID_Data_Structure.DID = await createDIDstring();
    const firstDID = DID_Data_Structure.DID;

    // DID issuer will ask for the time stamp before creation ofthe DID data strucure
    DID_Data_Structure.Metadata.DIDCreationTimestamp = new Date().toISOString()

    // DID issuer will generate a key pair corresponding to the DID to store
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: curve,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    DID_Data_Structure.DID_PubKey = publicKey.toString("hex")


    // DID issuer will compute the signature of  | DID Creation/Update Timestamp & Action |
    const sign = crypto.createSign(hash);
    const message = DID_Data_Structure.Metadata.Action + DID_Data_Structure.Metadata.DIDCreationTimestamp
    sign.write(message);
    sign.end();

    var signature = sign.sign(privateKey, 'hex');

    DID_Data_Structure.Metadata.Signature = signature

    // Convert object to json-string
    const DID_DataStructStr = stringify(sortKeysRecursive(DID_Data_Structure));

    console.log(DID_DataStructStr);


    // Convert json-string to the object
    const recovered_DID_DataStruct = JSON.parse(DID_DataStructStr);

    console.log(recovered_DID_DataStruct);

}

testCreateDID();

// testCreateDIDDoc();
// testJsonConversions();