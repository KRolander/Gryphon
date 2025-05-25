async function createDIDDocument(DID, controller, publicKey) {
    const doc = {
        "@context": "https://www.w3.org/ns/did/v1",
        "id": DID,
        "controller": controller,
        "verificationMethod": [
            {
            "id": DID.concat("#keys-1"),
            "type": "to be ",
            "controller": controller,
            "publicKeyBase58": publicKey
            }
        ],
        "authentication": [
            DID.concat("#keys-1")
        ],
        "assertionMethod": [
            DID.concat("#keys-1")
        ],
        // "service": [
        //     {
        //     "id": "did:example:123456789abcdefghi#vcs",
        //     "type": "VerifiableCredentialService",
        //     "serviceEndpoint": "https://example.com/vc/"
        //     }
        // ]
    }

    return doc;
}

async function createDID(){
    const randomString = base58Generator.encode(crypto.randomBytes(16));
    return 'did:hlf:'+randomString;
}

module.exports = {
    createDIDDocument,
    createDID
}