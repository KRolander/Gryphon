"use strict";
exports.__esModule = true;
var DIDDocumentBuilder = /** @class */ (function () {
    function DIDDocumentBuilder(DID, controllers, publicKey) {
        this.DID = DID;
<<<<<<< HEAD
        this.controller = controller;
        this.publicKeyPem = publicKey;
=======
        this.controllers = Array.isArray(controllers) ? controllers : [controllers];
        this.publicKey = publicKey;
>>>>>>> main
    }
    DIDDocumentBuilder.prototype.build = function () {
        var keyId = "".concat(this.DID, "#keys-1");
        return {
            "@context": "https://www.w3.org/ns/did/v1",
            id: this.DID,
            controllers: this.controllers,
            verificationMethod: [
                {
<<<<<<< HEAD
                    id: "".concat(this.controller, "#keys-1"),
                    type: "EcdsaSecp256r1VerificationKey2019",
                    controller: this.controller,
                    publicKeyPem: this.publicKeyPem
=======
                    id: keyId,
                    type: "to be",
                    controllers: this.controllers[0],
                    publicKeyBase58: this.publicKey
>>>>>>> main
                }
            ],
            authentication: [keyId],
            assertionMethod: [keyId]
        };
    };
    return DIDDocumentBuilder;
}());
exports["default"] = DIDDocumentBuilder;
