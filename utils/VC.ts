interface CredentialSubject {
  id: string // the DID of the holder
  [claim: string]: unknown;
}

function buildCredentialSubject(did: string, claims: { [claim: string]: unknown }): CredentialSubject {
  return {
    id: did,
    ...claims
  }
}

interface Proof {
  type: string; // the type of the used ecryption method
  created: string; //the creation date of this proof
  proofPurpose: string; // what is the purpose eg.: assertionMethod
  verificationMethod: string; // DID URL to public key
  signatureValue: string; // the actual signature
}

function buildProof(date: string, verificationMethod: string, signature: string): Proof {
  return {
    type: "EcdsaSecp256r1VerificationKey2019",
    created: date,
    proofPurpose: "assertionMethod",
    verificationMethod: verificationMethod,
    signatureValue: signature
  }
}

/**
 * The signed VC
 */
export interface VerifiableCredential {
  "@context": "https://www.w3.org/2018/credentials/v1";
  type: string[]; // must include VerifiableCredential
  issuer: string;  // the DID of the issuer
  issuanceDate: string; // ISO 8601 format
  credentialSubject: CredentialSubject;
  proof: Proof;
}

/**
 * Unsigned version of the VC
 */
export interface UnsignedVC {
  "@context": "https://www.w3.org/2018/credentials/v1";
  type: string[]; // must include VerifiableCredential
  issuer: string;  // the DID of the issuer
  issuanceDate: string; // ISO 8601 format
  credentialSubject: CredentialSubject;
}

interface VerifiablePresentation {
  "@context": "https://www.w3.org/2018/credentials/v1";
  type: string | string[]; // must include VerifiablePresentation
  // holder?: string; // optional field for the DID of the holder
  verifiableCredential: VerifiableCredential | VerifiableCredential[]; // a list of all verifiable credentials
  proof: Proof;
}

export class UnsignedVCBuilder {
  private issuer: string;
  private vcType: string[];
  private issuanceDate: string;
  private credentialSubject: CredentialSubject;

  constructor(vcType: string[], issuanceDate: string, issuer: string, subjectId: string, claims: { [claim: string]: unknown }) {
    this.vcType = vcType;
    this.issuer = issuer;
    this.credentialSubject = buildCredentialSubject(subjectId, claims);
    this.issuanceDate = issuanceDate;
  }

  build(): UnsignedVC {
    return {
      "@context": "https://www.w3.org/2018/credentials/v1",
      type: this.vcType,
      issuer: this.issuer,
      issuanceDate: this.issuanceDate,
      credentialSubject: this.credentialSubject,
    }
  }
}

export class VCBuilder {
  private issuer: string;
  private vcType: string[];
  private issuanceDate: string;
  private credentialSubject: CredentialSubject;
  private proof: Proof;

  constructor(unsignedVC: UnsignedVC, signatureCreationDate: string, verificationMethd: string, signature: string) {
    this.issuer = unsignedVC.issuer;
    this.vcType = unsignedVC.type;
    this.issuanceDate = unsignedVC.issuanceDate;
    this.credentialSubject = unsignedVC.credentialSubject;
    this.proof = buildProof(signatureCreationDate, verificationMethd, signature);
  }

  build(): VerifiableCredential {
    return {
      "@context": "https://www.w3.org/2018/credentials/v1",
      type: this.vcType,
      issuer: this.issuer,
      issuanceDate: this.issuanceDate,
      credentialSubject: this.credentialSubject,
      proof: this.proof
    }
  }
}

export class VPBuilder {
  private type: string | string[];
  private verifiableCredential: VerifiableCredential | VerifiableCredential[];
  private proof: Proof;

  constructor(type: string | string[], verifiableCredential: VerifiableCredential | VerifiableCredential[], proof: Proof) {
    this.type = type;
    this.verifiableCredential = verifiableCredential;
    this.proof = proof;
  }

  build(): VerifiablePresentation {
    return {
      "@context": "https://www.w3.org/2018/credentials/v1",
      type: this.type, 
      verifiableCredential: this.verifiableCredential,
      proof: this.proof
    }
  }
}


