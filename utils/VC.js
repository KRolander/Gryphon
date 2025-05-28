"use strict";
exports.__esModule = true;
exports.VPBuilder = exports.VCBuilder = exports.UnsignedVCBuilder = void 0;
var UnsignedVCBuilder = /** @class */ (function () {
    function UnsignedVCBuilder(vcType, issuanceDate, issuer, subject) {
        this.vcType = vcType;
        this.issuer = issuer;
        this.credentialSubject = subject;
        this.issuanceDate = issuanceDate;
    }
    UnsignedVCBuilder.prototype.build = function () {
        return {
            "@context": "https://www.w3.org/2018/credentials/v1",
            type: this.vcType,
            issuer: this.issuer,
            issuanceDate: this.issuanceDate,
            credentialSubject: this.credentialSubject
        };
    };
    return UnsignedVCBuilder;
}());
exports.UnsignedVCBuilder = UnsignedVCBuilder;
var VCBuilder = /** @class */ (function () {
    function VCBuilder(unsignedVC, proof) {
        this.unsignedVC = unsignedVC;
        this.proof = proof;
    }
    VCBuilder.prototype.build = function () {
        return {
            unsignedVC: this.unsignedVC,
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
