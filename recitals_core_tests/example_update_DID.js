const axios = require('axios');
const bs58 = require("bs58");
const stringify = require("fast-json-stable-stringify");
const sortKeysRecursive = require("sort-keys-recursive");

const crypto = require("crypto");

var hash = "sha256";
var curve = "secp256k1";


async function testUpdateDID(DID) {

    let metadata = {
        DIDCreationTimestamp: "NA", // Since it is an update
        DIDUpdateTimestamp: "", 
        Action: "UpdateDID",
        Signature: ""
    }

    let DID_Data_Structure = {
        DID: DID,
        DID_PubKey: "",
        Controller: "did:hlf:6KMWr3acfcqnLUzGCA3jMw",
        DC_flag_version: "v1.0",
        Metadata: metadata
    }

    // DID issuer will ask for the time stamp before update of the DID document will be possible
    DID_Data_Structure.Metadata.DIDUpdateTimestamp = new Date().toISOString()

    // DID issuer will generate a key pair corresponding to the DID to store
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: curve,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    DID_Data_Structure.DID_PubKey = publicKey.toString("hex")


    // DID issuer will compute the signature of  | DID Creation/Update Timestamp & Action |
    const sign = crypto.createSign(hash);
    const message = DID_Data_Structure.Metadata.Action + DID_Data_Structure.Metadata.DIDUpdateTimestamp
    sign.write(message);
    sign.end();

    var signature = sign.sign(privateKey, 'hex');

    DID_Data_Structure.Metadata.Signature = signature

    // Test of a successful DID creation
    try {
        const response = await axios.post('http://localhost:3000/did/updateDIDDataStruct', {
            publicKey: DID_Data_Structure.DID_PubKey,
            DIDDataStructure: DID_Data_Structure
        });

        console.log('------------------------------------------------------');
        console.log('[Successful DID Update]:');
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

// Update an existing DID - To repace accordingly
DID = "did:hlf:2SDaEPY6qBsdqyh3wpqAoY"
testUpdateDID(DID)
