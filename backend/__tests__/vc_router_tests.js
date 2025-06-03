const request = require('supertest');
const app = require('../app');
const vcValidationModule = require("../routes/vc");
const { startGateway, getGateway, getDIDDoc, getContract } = require('../gateway');
const { default: DIDDocumentBuilder } = require("../../utils/DIDDocumentBuilder.js");
const { VCBuilder, UnsignedVCBuilder } = require("../../utils/VC");
const { createSign } = require("crypto");
const crypto = require("crypto");
const canonicalize = require("canonicalize");

jest.mock('../gateway', () => ({
  startGateway: jest.fn(),
  getGateway: jest.fn(() => true),
  getContract: jest.fn(() => ({ /* mock contract object */ })),
  getDIDDoc: jest.fn()  // define, but override later
}));

/**---------Create the key pair for the test--------- */
const {publicKey, privateKey} = crypto.generateKeyPairSync('ec',{
        namedCurve: 'P-256',
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem' 
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        }
    })
const issuerDID = "did:hlf:issuer";
/**---------Create the DID Document of the issuer--------- */
const docBuilder = new DIDDocumentBuilder(issuerDID, issuerDID, publicKey);
const noKeyBuilder = new DIDDocumentBuilder(issuerDID, issuerDID, null);
//this will be the doc of the issuer
const doc = docBuilder.build();
const keylessDoc = noKeyBuilder.build();

describe("POST /vc/validate", () => {
    it("should return 200 and a valid message", async () => {
        getDIDDoc.mockReturnValue(doc);
        /**---------Create the unsigne VC--------- */
        const subDID = "did:hlf:subject";
        const uVCBuilder = new UnsignedVCBuilder("VerifiableCredential", "date", issuerDID, subDID, "claim");
        const uVC = uVCBuilder.build();

        /**---------Create the signature--------- */
        const canon = canonicalize(uVC);
        const signer = createSign('SHA256');
        signer.update(canon);
        signer.end();
        const signature = signer.sign(privateKey, 'base64');

        /**---------Sign the VC--------- */
        const sVCBuilder = new VCBuilder(uVC, "date1", "someURL", signature);

        const sVC = sVCBuilder.build();
        const keyId = doc.assertionMethod[0]; // get the id of the key used for the assertion method
        const method = doc.verificationMethod.find(vm => vm.id === keyId); // find that method in the list of verification methods

        //if(!pkId)
        const pk = method.publicKeyPem;
        //const result = await vcValidationModule.validateVC(sVC, pk);
        //console.log(result);

        const response = await request(app)
            .post("/vc/validate")
            .send(sVC)
            .expect(200);

        expect(response.text).toBe("The VC is valid (it was issued by the issuer)");
    });

    it("should return 400 because of invalid issuer", async () => {
        getDIDDoc.mockReturnValue(doc);
        /**---------Create the unsigne VC--------- */
        const subDID = "did:hlf:subject";
        const uVCBuilder = new UnsignedVCBuilder("VerifiableCredential", "date", null, subDID, "claim");
        const uVC = uVCBuilder.build();

        /**---------Create the signature--------- */
        const canon = canonicalize(uVC);
        const signer = createSign('SHA256');
        signer.update(canon);
        signer.end();
        const signature = signer.sign(privateKey, 'base64');

        /**---------Sign the VC--------- */
        const sVCBuilder = new VCBuilder(uVC, "date1", "someURL", signature);

        const sVC = sVCBuilder.build();
        const keyId = doc.assertionMethod[0]; // get the id of the key used for the assertion method
        const method = doc.verificationMethod.find(vm => vm.id === keyId); // find that method in the list of verification methods

        //if(!pkId)
        const pk = method.publicKeyPem;
        const result = vcValidationModule.validateVC(sVC, pk);

        const response = await request(app)
            .post("/vc/validate")
            .send(sVC)
            .expect(400);

        expect(response.text).toBe("All VCs require an issuer field");
    });

    it("should return 400 because there is no VC", async () => {

        const response = await request(app)
            .post("/vc/validate")
            .send(null)
            .expect(400);

        expect(response.text).toBe("VC required");
    });

    it("should return 500 because the issuer is not valid", async () => {
        getDIDDoc.mockReturnValue(null);
        /**---------Create the unsigne VC--------- */
        const subDID = "did:hlf:subject";
        const uVCBuilder = new UnsignedVCBuilder("VerifiableCredential", "date", issuerDID, subDID, "claim");
        const uVC = uVCBuilder.build();

        /**---------Create the signature--------- */
        const canon = canonicalize(uVC);
        const signer = createSign('SHA256');
        signer.update(canon);
        signer.end();
        const signature = signer.sign(privateKey, 'base64');

        /**---------Sign the VC--------- */
        const sVCBuilder = new VCBuilder(uVC, "date1", "someURL", signature);

        const sVC = sVCBuilder.build();

        const response = await request(app)
            .post("/vc/validate")
            .send(sVC)
            .expect(500);

        expect(response.text).toBe("The DID does not exist");
    });

    it("should return 400 because the issuer does not have a public key", async () => {
        getDIDDoc.mockReturnValue(keylessDoc);
        /**---------Create the unsigne VC--------- */
        const subDID = "did:hlf:subject";
        const uVCBuilder = new UnsignedVCBuilder("VerifiableCredential", "date", issuerDID, subDID, "claim");
        const uVC = uVCBuilder.build();

        /**---------Create the signature--------- */
        const canon = canonicalize(uVC);
        const signer = createSign('SHA256');
        signer.update(canon);
        signer.end();
        const signature = signer.sign(privateKey, 'base64');

        /**---------Sign the VC--------- */
        const sVCBuilder = new VCBuilder(uVC, "date1", "someURL", signature);

        const sVC = sVCBuilder.build();

        const response = await request(app)
            .post("/vc/validate")
            .send(sVC)
            .expect(400);

        expect(response.text).toBe("This DID does not have a public key");
    });

    it("should return 200 but it should be false because the VC is not valid", async () => {
        getDIDDoc.mockReturnValue(doc);
        /**---------Create the unsigne VC--------- */
        const subDID = "did:hlf:subject";
        const uVCBuilder = new UnsignedVCBuilder("VerifiableCredential", "date", issuerDID, subDID, "claim");
        const uVC = uVCBuilder.build();

        /**---------Sign the VC--------- */
        const signer = createSign('SHA256');
        signer.update("signature");
        signer.end();
        const signature = signer.sign(privateKey, 'base64');
        const sVCBuilder = new VCBuilder(uVC, "date1", "someURL", signature);

        const sVC = sVCBuilder.build();
        const keyId = doc.assertionMethod[0]; // get the id of the key used for the assertion method
        const method = doc.verificationMethod.find(vm => vm.id === keyId); // find that method in the list of verification methods
        const response = await request(app)
            .post("/vc/validate")
            .send(sVC)
            .expect(200);

        expect(response.text).toBe("The VC is not valid (it was not issued by the issuer)");
    });
});
