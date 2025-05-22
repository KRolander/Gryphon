interface VerificationMethod {
    id: string;
    type: string;
    controller: string;
    publicKeyBase58: string;
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
    private publicKey: string;

    constructor(DID: string, controller: string, publicKey: string) {
        this.DID = DID;
        this.controller = controller;
        this.publicKey = publicKey;
    }

    build(): DIDDocument {
        const keyId = `${this.DID}#keys-1`;

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
