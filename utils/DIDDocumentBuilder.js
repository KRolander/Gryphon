"use strict";
exports.__esModule = true;
var DIDDocumentBuilder = /** @class */ (function () {
    function DIDDocumentBuilder(DID, controllers, publicKey) {
        this.DID = DID;
        this.controllers = Array.isArray(controllers) ? controllers : [controllers];
        this.publicKey = publicKey;
    }
    DIDDocumentBuilder.prototype.build = function () {
        var keyId = "".concat(this.DID, "#keys-1");
        return {
            "@context": "https://www.w3.org/ns/did/v1",
            id: this.DID,
            controllers: this.controllers.length === 1 ? this.controllers[0] : this.controllers,
            verificationMethod: [
                {
                    id: keyId,
                    type: "to be",
                    controllers: this.controllers[0],
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
