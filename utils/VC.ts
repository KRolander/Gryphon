import { JWTPayload } from 'did-jwt';

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

// Check https://www.w3.org/TR/vc-data-model/#jwt-encoding 
// for explanation related to the fields 
interface VerifiableCredential<T extends CredentialSubject = CredentialSubject> {
  "@context": "https://www.w3.org/2018/credentials/v1";
  type: string | string[]; // must include VerifiableCredential
  issuer: string;  // the DID of the issuer
  issuanceDate: string; // ISO 8601 format
  // expirationDate?: string; 
  credentialSubject: T;
  proof: Proof;
}

interface VerifiablePresentation {
  "@context": "https://www.w3.org/2018/credentials/v1";
  type: string | string[]; // must include VerifiablePresentation
  // holder?: string; // optional field for the DID of the holder
  verifiableCredential: VerifiableCredential | VerifiableCredential[]; // a list of all verifiable credentials
  proof: Proof;
}

export class VCBuilder<T extends CredentialSubject> {
  private issuer: string;
  private vcType: string | string[];
  private issuanceDate: string;
  private credentialSubject: T;
  private proof: Proof;

  constructor(vcType: string | string[], issuanceDate: string, issuer: string, subject: T, proof: Proof) {
    this.vcType = vcType;
    this.issuer = issuer;
    this.credentialSubject = subject;
    this.issuanceDate = issuanceDate;
    this.proof = proof;
  }

  build(): VerifiableCredential<T> {
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

function vcToJWTPayload<T extends CredentialSubject>(
  vc: VerifiableCredential<T>): JWTPayload {
    return {
      iss: vc.issuer,
      sub: vc.credentialSubject.id,
      nbf: Math.floor(new Date(vc.issuanceDate).getTime() / 1000),
      vc: {
        '@context': [vc['@context']],
        type: Array.isArray(vc.type) ? vc.type : [vc.type],
        credentialSubject: vc.credentialSubject
      }
    }
}

