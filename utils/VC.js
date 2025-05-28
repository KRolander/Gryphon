"use strict";
exports.__esModule = true;
exports.VPBuilder = exports.VCBuilder = void 0;
var VCBuilder = /** @class */ (function () {
    function VCBuilder(vcType, issuanceDate, issuer, subject, proof) {
        this.vcType = vcType;
        this.issuer = issuer;
        this.credentialSubject = subject;
        this.issuanceDate = issuanceDate;
        this.proof = proof;
    }
    VCBuilder.prototype.build = function () {
        return {
            "@context": "https://www.w3.org/2018/credentials/v1",
            type: this.vcType,
            issuer: this.issuer,
            issuanceDate: this.issuanceDate,
            credentialSubject: this.credentialSubject,
            proof: this.proof
        };
    };
    return VCBuilder;
}());
exports.VCBuilder = VCBuilder;
var VPBuilder = /** @class */ (function () {
    function VPBuilder(type, verifiableCredential, proof) {
        this.type = type;
        this.verifiableCredential = verifiableCredential;
        this.proof = proof;
    }
    VPBuilder.prototype.build = function () {
        return {
            "@context": "https://www.w3.org/2018/credentials/v1",
            type: this.type,
            verifiableCredential: this.verifiableCredential,
            proof: this.proof
        };
    };
    return VPBuilder;
}());
exports.VPBuilder = VPBuilder;
