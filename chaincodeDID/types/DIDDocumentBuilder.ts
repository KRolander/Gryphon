interface VerificationMethod {
    id: string;
    type: string;
    controllers: string;
    publicKeyPem: string;
}

interface Service {
    id: string;
    type: string;
    serviceEndpoint: string;
}

export interface DIDDocument {
    "@context": string;
    id: string;
    controllers: string[] | string;
    verificationMethod: VerificationMethod[];
    authentication: string[];
    assertionMethod: string[];
    service?: Service[];
}

export default class DIDDocumentBuilder {
    private DID: string;
    private controllers: string[];
    private publicKey: string;
    private serviceEndPoint: string;

    constructor(DID: string, controllers: string[] | string, publicKey: string, serviceEndPoint: string) {
        this.DID = DID;
         this.controllers = Array.isArray(controllers) ? controllers : [controllers];
        this.publicKey = publicKey;
        this.serviceEndPoint = serviceEndPoint;
    }

    build(): DIDDocument {
        const keyId = `${this.DID}#keys-1`;

        return {
            "@context": "https://www.w3.org/ns/did/v1",
            id: this.DID,
            controllers: this.controllers.length === 1 ? this.controllers[0] : this.controllers,
            verificationMethod: [
                {
                    id: keyId,
                    type: "EcdsaSecp256r1VerificationKey2019", 
                    controllers: this.controllers[0],
                    publicKeyPem: this.publicKey
                }
            ],
            authentication: [keyId],
            assertionMethod: [keyId],
            service: [
                {
                    id: `${this.DID}#vcs`,
                    type: "VerifiableCredentialService",
                    serviceEndpoint: this.serviceEndPoint
                }
            ]
        };
    }
}

