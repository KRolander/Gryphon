interface VerificationMethod {
    id: string;
    type: string;
    controller: string;
    publicKeyPem: string;
}

interface Service {
    id: string;
    type: string;
    serviceEndpoint: string;
}

interface DIDDocument {
    "@context": string;
    id: string;
    controller: string;
    verificationMethod: VerificationMethod[];
    authentication: string[];
    assertionMethod: string[];
    service?: Service[];
}

export default class DIDDocumentBuilder {
    private DID: string;
    private controller: string;
    private publicKeyPem: string;

    constructor(DID: string, controller: string, publicKey: string) {
        this.DID = DID;
        this.controller = controller;
        this.publicKeyPem = publicKey;
    }

    build(): DIDDocument {
        const keyId = `${this.DID}#keys-1`;

        return {
            "@context": "https://www.w3.org/ns/did/v1",
            id: this.DID,
            controller: this.controller,
            verificationMethod: [
                {
                    id: `${this.controller}#keys-1`,         
                    type: "EcdsaSecp256r1VerificationKey2019", 
                    controller: this.controller,             
                    publicKeyPem: this.publicKeyPem  
                }
            ],
            authentication: [keyId],
            assertionMethod: [keyId],
            // service: [
            //     {
            //         id: `${this.DID}#vcs`,
            //         type: "VerifiableCredentialService",
            //         serviceEndpoint: "https://example.com/vc/"
            //     }
            // ]
        };
    }
}
