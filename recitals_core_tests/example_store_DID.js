const axios = require('axios');
const bs58 = require("bs58");
const stringify = require("fast-json-stable-stringify");

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
    return DID_Data_Structure.DID
  
}


// Returns an a DID Data structure if the DID was created and stored on the DLT
async function  testGetDIDDataStruct(DID) {
    try{
        const response = await axios.get('http://localhost:3000/did/getDID/' + DID);

        console.log('------------------------------------------------------');
        console.log('[Successful DID Get DID Data structure]:');
        console.log('------------------------------------------------------');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        console.log('------------------------------------------------------');
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}


// Create a new DID and test if was stored on the ledger and it is accessible
testCreateDID().then((DID) => testGetDIDDataStruct(DID)).catch(console.error);
