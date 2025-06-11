"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.VPBuilder = exports.VCBuilder = exports.UnsignedVCBuilder = void 0;
function buildCredentialSubject(did, claims) {
    return __assign({ id: did }, claims);
}
function buildProof(date, verificationMethod, signature) {
    return {
        type: "EcdsaSecp256r1VerificationKey2019",
        created: date,
        proofPurpose: "assertionMethod",
        verificationMethod: verificationMethod,
        signatureValue: signature
    };
}
var UnsignedVCBuilder = /** @class */ (function () {
    function UnsignedVCBuilder(vcType, issuanceDate, issuer, subjectId, claims) {
        this.vcType = vcType;
        this.issuer = issuer;
        this.credentialSubject = buildCredentialSubject(subjectId, claims);
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
    function VCBuilder(unsignedVC, signatureCreationDate, verificationMethd, signature) {
        this.issuer = unsignedVC.issuer;
        this.vcType = unsignedVC.type;
        this.issuanceDate = unsignedVC.issuanceDate;
        this.credentialSubject = unsignedVC.credentialSubject;
        this.proof = buildProof(signatureCreationDate, verificationMethd, signature);
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
