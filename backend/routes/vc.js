/*----------IMOPRTS----------*/
const { createVerify } = require('crypto');
const canonicalize = require('canonicalize');

/**
 * This function is only meant to verify the signature
 * of to make sure that it is valid. Later, the issuer will 
 * be checked using the trustchain
 * @param {object} vc - The signed VC. It MUST include the proof field (and it should be a JSON)
 * @param {string} public 
 * @returns {boolean} True if the VC is valid, false otherwise
 */
async function verifyVCValidity(vc, publicKey) {
    const { proof, ...rest } = vc;
    if(!proof || !proof.signatureValue) {
        throw new Error('Missing or invalid proof');
    }

    const canon = canonicalize(rest); //serialize the VC (without the proof field)
    if(!canon)
        throw new Error('Faild to canonicalize VC');
    const verifier = createVerify('SHA256');
    verifier.update(canon);
    verifier.end();

    return verifier.verify(publicKey, proof.signatureValue, 'base64');
}
