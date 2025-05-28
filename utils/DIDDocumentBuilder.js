"use strict";
exports.__esModule = true;
var DIDDocumentBuilder = /** @class */ (function () {
    function DIDDocumentBuilder(DID, controller, publicKey) {
        this.DID = DID;
        this.controller = controller;
        this.publicKeyPem = publicKey;
    }
    DIDDocumentBuilder.prototype.build = function () {
        var keyId = "".concat(this.DID, "#keys-1");
        return {
            "@context": "https://www.w3.org/ns/did/v1",
            id: this.DID,
            controller: this.controller,
            verificationMethod: [
                {
                    id: "".concat(this.controller, "#keys-1"),
                    type: "EcdsaSecp256r1VerificationKey2019",
                    controller: this.controller,
                    publicKeyPem: this.publicKeyPem
                }
            ],
            authentication: [keyId],
            assertionMethod: [keyId]
        };
    };
    return DIDDocumentBuilder;
}());
exports["default"] = DIDDocumentBuilder;
