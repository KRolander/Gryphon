interface CredentialSubject {
  id: string // the DID of the holder
  [claim: string]: unknown;
}

interface Proof {
  type: string; // the type of the used ecryption method
  created: string; //the creation date of this proof
  proofPurpose: string; // what is the purpose eg.: assertionMethod
  verificationMethod: string; // DID URL to public key
  signatureValue: string; // the actual signature
}

/**
 * The signed VC
 */
interface VerifiableCredential<T extends CredentialSubject = CredentialSubject> {
  unsignedVC: UnsignedVC;
  proof: Proof;
}

/**
 * Unsigned version of the VC
 */
interface UnsignedVC<T extends CredentialSubject = CredentialSubject> {
  "@context": "https://www.w3.org/2018/credentials/v1";
  type: string | string[]; // must include VerifiableCredential
  issuer: string;  // the DID of the issuer
  issuanceDate: string; // ISO 8601 format
  credentialSubject: T;
}

interface VerifiablePresentation {
  "@context": "https://www.w3.org/2018/credentials/v1";
  type: string | string[]; // must include VerifiablePresentation
  // holder?: string; // optional field for the DID of the holder
  verifiableCredential: VerifiableCredential | VerifiableCredential[]; // a list of all verifiable credentials
  proof: Proof;
}

export class UnsignedVCBuilder<T extends CredentialSubject> {
  private issuer: string;
  private vcType: string | string[];
  private issuanceDate: string;
  private credentialSubject: T;

  constructor(vcType: string | string[], issuanceDate: string, issuer: string, subject: T) {
    this.vcType = vcType;
    this.issuer = issuer;
    this.credentialSubject = subject;
    this.issuanceDate = issuanceDate;
  }

  build(): UnsignedVC<T> {
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
  private unsignedVC;
  private proof: Proof;

  constructor(unsignedVC: UnsignedVC, proof: Proof) {
    this.unsignedVC = unsignedVC;
    this.proof = proof;
  }

  build(): VerifiableCredential {
    return {
      unsignedVC: this.unsignedVC,
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


