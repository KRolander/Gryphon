const axios = require('axios');

const bs58 = require("bs58");
const stringify = require("fast-json-stable-stringify");
const sortKeysRecursive = require("sort-keys-recursive");

const crypto = require("crypto");

var hash = "sha256";
var curve = "secp256k1";

async function createDID_DataStructure_Test() {

  let metadata = {
    DIDCreationTimestamp: "2026-01-22T08:10:26.522Z",
    DIDUpdateTimestamp: "NA", // Since it is a creation
    Action: "CreateDID",
    Signature:
      "304402205e2be1aa831883a90fc47214188882ff0b35e5e11bee71569a66e7551cc1592f02202c8ebb811b206973ee364d693024ecdf7e6dfdb6f2c384df6abd315f853c198f",
  };

  let DID_Data_Structure = {
    DID: "did:hlf:TVBG0KVr6REzGT9V77T2f",
    DID_PubKey:
      "-----BEGIN PUBLIC KEY-----\nMFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE4tB0hHSN5w9XcnNMO5o9zLePkrWYKbDA\nHhw+X7l9bfPfucrAG8+ljsxulxwyKPcAo57Y68CD71uVhHCv9DoWrA==\n-----END PUBLIC KEY-----\n",
    Controller: "did:hlf:TvbG0kVr6rezGT9VR7t2F",
    DC_flag_version: "v1.0",
    Metadata: metadata,
  };


  try {
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
    console.log("TEST: Create DID Data Structure with success - expected response (200)")
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")

    const response = await axios.post('http://localhost:3000/did/createDIDDataStruct', {
      publicKey: DID_Data_Structure.DID_PubKey,
      DIDDataStructure: DID_Data_Structure
    });

    if (response.data.DID != DID_Data_Structure.DID) throw new Error("DID Data Structure mismatch");

    console.log("[Successful]\n - Create DID Data Structure response:", response.data)
    console.log("Response status: \n", response.status)




    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
    console.log("TEST: Create DID Data Structure with error - missing field in the structure - expected response (400)")
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")

    // Empty DID field
    DID_Data_Structure.DID = ""

    try {
      const response400 = await axios.post('http://localhost:3000/did/createDIDDataStruct', {
        publicKey: DID_Data_Structure.DID_PubKey,
        DIDDataStructure: DID_Data_Structure

      });

    } catch (error_400) {

      console.log("Expected Error status (400) - response received:", error_400.response.status);
      console.log("Error message:", error_400.response.data);

      if (error_400.response.status != "400") throw Error("Expected error 400 - got :", error_400.status);
    }

    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
    console.log("TEST: Create DID Data Structure with error - not valid signature or manipulated message - expected response (501)")
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")



    DID_Data_Structure.DID = "did:hlf:VSCH39SXLPeWgt9V76T2U"

    // Different signature that the sign(Action + DIDCreationTimestamp) would result in
    DID_Data_Structure.Metadata.Signature = "304402205e2be1aa831883a90fc47214188882ff0b35e5e11bee71569a66e7551cc1592f02202c8ebb811b206973ee364d693024ecdf7e6dfdb6f2c384df6abd315f853c198e"

    try {
      const response501 = await axios.post('http://localhost:3000/did/createDIDDataStruct', {
        publicKey: DID_Data_Structure.DID_PubKey,
        DIDDataStructure: DID_Data_Structure

      });

    } catch (error_501) {

      console.log("Expected Error status (501) - response received:", error_501.response.status);
      console.log("Error message:", error_501.response.data);

      if (error_501.response.status != "501") throw Error("Expected error 501 - got :", error_501.response.status);
    }




    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
    console.log("TEST: Create DID Data Structure with error - DID already exists - expected response (500)")
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")


    // Use the same DID
    DID_Data_Structure.DID = "did:hlf:TVBG0KVr6REzGT9V77T2f";


    try {
      const response500 = await axios.post('http://localhost:3000/did/createDIDDataStruct', {
        publicKey: DID_Data_Structure.DID_PubKey,
        DIDDataStructure: DID_Data_Structure

      });

    } catch (error_500) {

      console.log("Expected Error status (500) - response received:", error_500.response.status);
      console.log("Error message:", error_500.response.data);

      if (error_500.response.status != "500") throw Error("Expected error 500 - got :", error_500.response.status);
    }


    console.log("✅ All tests passed!");
  } catch (err) {
    console.error("Test failed:", err.message);
  }

}

async function getDID_DataStructure_Test() {

  const DID = "did:hlf:TVBG0KVr6REzGT9V77T2f"

  try {
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
    console.log("TEST: Get DID Data Structure with success - expected response (200)")
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")

    const response = await axios.get('http://localhost:3000/did/getDID/' + DID);

    console.log('------------------------------------------------------');
    console.log('[Successful DID Get DID Data structure]:');
    console.log('------------------------------------------------------');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('------------------------------------------------------');


    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
    console.log("TEST: Get DID Data Structure with error - the DID does not exist yet");
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");

    const DID_note_exist = "did:hlf:TVBG0KVr6REzGT9V77T2f";

    try {
      const response_500 = await axios.get('http://localhost:3000/did/getDID/' + DID_note_exist);


    } catch (error_500) {

      console.log("Expected Error status (500) - response received:", error_500.response.status);
      console.log("Error message:", error_500.response.data);

      if (error_500.response.status != "500") throw Error("Expected error 500 - got :", error_500.response.status);
    }


    console.log("✅ All tests passed!");
  } catch (err) {
    console.error("Test failed:", err.message);
  }

}

async function updateDID_DataStruct_Test() {

  // First create a new DID with the a new private key, which will be used for this test

  let metadata_create = {
    DIDCreationTimestamp: "2026-01-22T08:10:26.522Z",
    DIDUpdateTimestamp: "NA", // Since it is a creation
    Action: "CreateDID",
    Signature: "",
  };

  let DID_Data_Structure_create = {
    DID: "did:hlf:TvbG0kVr6rezGT9VR7t2F",
    DID_PubKey: "",
    Controller: "did:hlf:TvbG0kVr6rezGT9VR7t2F",
    DC_flag_version: "v1.0",
    Metadata: metadata_create,
  };

  //////////////////////////////////////////////////////////////////////////
  // DID issuer will generate a key pair corresponding to the DID to store
  /////////////////////////////////////////////////////////////////////////

  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: curve,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  DID_Data_Structure_create.DID_PubKey = publicKey.toString("hex")

  // DID issuer will compute the signature of  | DID Creation/Update Timestamp & Action |
  const sign = crypto.createSign(hash);
  const message = DID_Data_Structure_create.Metadata.Action + DID_Data_Structure_create.Metadata.DIDCreationTimestamp
  sign.write(message);
  sign.end();

  var signature = sign.sign(privateKey, 'hex');

  DID_Data_Structure_create.Metadata.Signature = signature

  //////////////////////////////////////////////////////////////////////////
  // Create DID before the modification
  //////////////////////////////////////////////////////////////////////////
  try {
    const response = await axios.post('http://localhost:3000/did/createDIDDataStruct', {
      publicKey: DID_Data_Structure_create.DID_PubKey,
      DIDDataStructure: DID_Data_Structure_create
    });

    console.log('------------------------------------------------------');
    console.log('[Successful DID Creation]:');
    console.log('------------------------------------------------------');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('------------------------------------------------------');

  } catch (err_) {
    if (err_.response.status != "200") throw Error("Expected resonse 200 - got : ", err_.response.status);
  }

  let metadata = {
    DIDCreationTimestamp: "NA",
    DIDUpdateTimestamp: "2026-08-22T08:10:26.522Z", // Since it is a creation
    Action: "UpdateDID",
    Signature: "",
  };

  let DID_Data_Structure = {
    DID: "did:hlf:TvbG0kVr6rezGT9VR7t2F",
    DID_PubKey: DID_Data_Structure_create.DID_PubKey,
    Controller: "did:hlf:TvbG0kVr6rezGT9VR7t2F",
    DC_flag_version: "v1.0",
    Metadata: metadata,
  };

  // DID issuer will compute the signature of  | DID Creation/Update Timestamp & Action |
  const sign_update = crypto.createSign(hash);
  const message_update = DID_Data_Structure.Metadata.Action + DID_Data_Structure.Metadata.DIDUpdateTimestamp
  sign_update.write(message_update);
  sign_update.end();

  var signature = sign_update.sign(privateKey, 'hex');

  DID_Data_Structure.Metadata.Signature = signature


  /////////////////////////////////////////////////////////
  // Update the previously created data structure
  /////////////////////////////////////////////////////////

  try {
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
    console.log("TEST: Updadte DID Data Structure with success - expected response (200)")
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")

    const response = await axios.post('http://localhost:3000/did/updateDIDDataStruct', {
      publicKey: DID_Data_Structure.DID_PubKey,
      DIDDataStructure: DID_Data_Structure
    });

    if (response.data.DID != DID_Data_Structure.DID) throw new Error("DID Data Structure mismatch");

    console.log("[Successful]\n - Create DID Data Structure response:", response.data)
    console.log("Response status: \n", response.status)




    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
    console.log("TEST: Update DID Data Structure with error - missing field in the structure - expected response (400)")
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")

    // Empty DID field
    DID_Data_Structure.DID = ""

    try {
      const response400 = await axios.post('http://localhost:3000/did/updateDIDDataStruct', {
        publicKey: DID_Data_Structure.DID_PubKey,
        DIDDataStructure: DID_Data_Structure

      });

    } catch (error_400) {

      console.log("Expected Error status (400) - response received:", error_400.response.status);
      console.log("Error message:", error_400.response.data);

      if (error_400.response.status != "400") throw Error("Expected error 400 - got :", error_400.status);
    }

    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
    console.log("TEST: Update DID Data Structure with error - not valid signature or manipulated message - expected response (501)")
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")



    DID_Data_Structure.DID = "did:hlf:TvbG0kVr6rezGT9VR7t2F"

    // Different signature that the sign(Action + DIDCreationTimestamp) would result in
    DID_Data_Structure.Metadata.Signature = signature.slice(0, -1) + "e";


    try {
      const response501 = await axios.post('http://localhost:3000/did/updateDIDDataStruct', {
        publicKey: DID_Data_Structure.DID_PubKey,
        DIDDataStructure: DID_Data_Structure

      });

    } catch (error_501) {

      console.log("Expected Error status (501) - response received:", error_501.response.status);
      console.log("Error message:", error_501.response.data);

      if (error_501.response.status != "501") throw Error("Expected error 501 - got :", error_501.response.status);
    }




    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
    console.log("TEST: Update DID Data Structure with error - DID already exists - expected response (500)")
    console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")


    // Use the same DID
    DID_Data_Structure.DID = "did:hlf:TvbG0kVr6rezGT9VR7t2F";


    try {
      const response500 = await axios.post('http://localhost:3000/did/updateDIDDataStruct', {
        publicKey: DID_Data_Structure.DID_PubKey,
        DIDDataStructure: DID_Data_Structure

      });

    } catch (error_500) {

      console.log("Expected Error status (500) - response received:", error_500.response.status);
      console.log("Error message:", error_500.response.data);

      if (error_500.response.status != "500") throw Error("Expected error 500 - got :", error_500.response.status);
    }


    console.log("✅ All tests passed!");
  } catch (err) {
    console.error("Test failed:", err.message);
  }

}


async function runTests() {
  // await createDID_DataStructure_Test();
  // await getDID_DataStructure_Test();
  await updateDID_DataStruct_Test();
}

runTests();