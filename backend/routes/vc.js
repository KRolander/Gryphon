/*----------IMOPRTS----------*/
const { createVerify } = require('crypto');
const canonicalize = require('canonicalize');
const express = require('express');
const axios = require('axios');
const {
  startGateway,
  getGateway,
  getContract,
  getDIDDoc,
  getMap
} = require("../gateway");

router = express.Router();

/**
 * This function recieves a JSON of a 
 * VC and it checks if the signature
 * is correct or not
 */  
router.post("/verify", async (req, res) => {
    try {
        if (getGateway() == null) {
            await startGateway();
        }

        const VC = req.body;

        if(!VC)
            return res.status(400).send("VC required");

        const issuerDID = VC.unsignedVC.issuer;
        if(!issuerDID)
            return res.status(400).send("All VCs require an issuer field");

        // get issuer DID Document
        const issuerDoc = getDIDDoc(getContract(), issuerDID);
        if(!issuerDoc)
            return res.status(500).send("The DID does not exist");
    
        //get its public key
        const publicKey = issuerDoc.verificationMethod[0].publicKeyPem;
        if(!publicKey)
            return res.status(400).send("This DID does not have a public key"); 

        // run the validate method
        const validity = await validateVC(VC, publicKey);
        if(validity == true)
            res.status(200).send("The VC is valid (it was issued by the issuer)");
        else 
            res.status(200).send("The VC is not valid (it was not issued by the issuer)");

        
    } catch (error) {
        console.log(error);
        console.error("Error validating the VC");
        res.status(500).send("Error validating the VC");
    }
});


router.post("/verifyDeep", async (req, res) => {
    try {
        if (getGateway() == null) {
            await startGateway();
        }

        const VC = req.body;
        
        if(!VC)
            return res.status(400).send("VC required");
         
        let currentVC = VC;
        let current = currentVC.unsignedVC.credentialSubject.id; // we get the DID of the user
        let userDID = currentVC.unsignedVC.credentialSubject.id; // this is for a more clear description
        while(!isRoot(current)) { // if the current DID is not the root, then we continue up the trustchain
            const issuerDID = currentVC.unsignedVC.issuer;
            if(!issuerDID)
                return res.status(400).send("All VCs require an issuer field");

            // get issuer DID Document
            const issuerDoc = getDIDDoc(getContract(), issuerDID);
            if(!issuerDoc)
                return res.status(500).send("The DID does not exist");
    
            //get its public key
            const publicKey = issuerDoc.verificationMethod[0].publicKeyPem;
            if(!publicKey)
                return res.status(400).send("This DID does not have a public key"); 

            // run the validate method
            const validity = await validateVC(VC, publicKey);
            if(validity == false) {
                if(current == userDID)
                    return res.status(200).send("The VC is invalid, as it was not signed by the issuer.");
                else 
                    return res.status(200).send("The VC is invalid, there was a problem verifying it up the trustchain.");
            }
            else {
                // Here is where the magic happens. There should be a function that retrieves
                // the map from the ledger and with that information it should choose the correct VC from 
                // the public repository
                const map = await getMap(getContract()); // structure that maps a issed VC to the VC required by the issuer
                const repoEndpoint = issuerDoc.service.find(serv => serv.id === `${this.DID}#vcs`); // we find the service that points towards the location of the public repository
                const endpoint = repoEndpoint.serviceEndpoint; // we retrive the endpoint of the repository
                const registry = await fetchRegistry(endpoint);
            }
        }

        
    } catch (error) {
        console.log(error);
        console.error("Error validating the VC");
        res.status(500).send("Error validating the VC");
    }
});
/**
 * This function is only meant to verify the signature
 * of to make sure that it is valid. Later, the issuer will 
 * be checked using the trustchain
 * @param {object} vc - The signed VC. It MUST include the proof field (and it should be a JSON)
 * @param {string} public 
 * @returns {boolean} True if the VC is valid, false otherwise
 */
async function validateVC(vc, publicKey) {
    const { proof, ...rest } = vc;  // separate the VC into the unsigned vc (rest) and the proof
    if(!proof || !proof.signatureValue) {
        throw new Error('Missing or invalid proof');
    }

    const canon = canonicalize(rest.unsignedVC); //serialize the VC (without the proof field)
    if(!canon)
        throw new Error('Faild to canonicalize VC');
    const verifier = createVerify('SHA256'); // hash the string representing the unsigned VC
    verifier.update(canon);
    verifier.end();

    return verifier.verify(publicKey, proof.signatureValue, 'base64'); // verify that the signature is correct
}

async function verifyVC(vc, map, root) {
    let curr = vc.unsignedVC.credentialSubject.id; // this is the DID of the user
    while(curr != root) { // if the current DID is the same as the DID of the root (in this case maybe the government), then it emans we finshed the trustchain

    }
}

/**
 * This function is used to retrieve the public registry of
 * an organization
 * @param {string} url the service endpoint of an organization
 * @returns the public registry of the organization orgName
 */
async function fetchRegistry(url) {
    const url = `http://localhost:3000/registry/${orgName}`;
    try {
        const response = await axios.get(url);
        const registry = response.data;
        console.log("Fetched registry:", registry);
        return registry;
    } catch (error) {
        if (error.response) {
            console.error("Error:", error.response.status, error.response.data);
        } else {
            console.error("Network or server error:", error.message);
        }
    return null;
  }
}

module.exports = {
    validateVC,
    router
}