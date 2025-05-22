"use strict";
exports.__esModule = true;
var DIDDocumentBuilder = /** @class */ (function () {
    function DIDDocumentBuilder(DID, controller, publicKey) {
        this.DID = DID;
        this.controller = controller;
        this.publicKey = publicKey;
    }
    DIDDocumentBuilder.prototype.build = function () {
        var keyId = "".concat(this.DID, "#keys-1");
        return {
            "@context": "https://www.w3.org/ns/did/v1",
            id: this.DID,
            controller: this.controller,
            verificationMethod: [
                {
                    id: keyId,
                    type: "to be",
                    controller: this.controller,
                    publicKeyBase58: this.publicKey
                }
            ],
            authentication: [keyId],
            assertionMethod: [keyId]
        };
    };
    return DIDDocumentBuilder;
}());
exports["default"] = DIDDocumentBuilder;
