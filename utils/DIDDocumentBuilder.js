"use strict";
exports.__esModule = true;
var DIDDocumentBuilder = /** @class */ (function () {
    function DIDDocumentBuilder(DID, controllers, publicKey, serviceEndPoint) {
        this.DID = DID;
        this.controllers = Array.isArray(controllers) ? controllers : [controllers];
        this.publicKey = publicKey;
        this.serviceEndPoint = serviceEndPoint;
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
                    type: "EcdsaSecp256r1VerificationKey2019",
                    controllers: this.controllers[0],
                    publicKey: this.publicKey
                }
            ],
            authentication: [keyId],
            assertionMethod: [keyId],
            service: [
                {
                    id: "".concat(this.DID, "#vcs"),
                    type: "VerifiableCredentialService",
                    serviceEndpoint: this.serviceEndPoint
                }
            ]
        };
    };
    return DIDDocumentBuilder;
}());
exports["default"] = DIDDocumentBuilder;
