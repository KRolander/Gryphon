const { VCBuilder, UnsignedVCBuilder } = require("../../utils/VC");
const vcValidationModule = require("../routes/vc");
const { createSign } = require("crypto");
const crypto = require("crypto");
const canonicalize = require("canonicalize");

describe("validateVC", () => {
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

    /**---------Create the unsigne VC--------- */
    const issuerDID = "did:hlf:issuer";
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

    /**---------Check the result--------- */
    test("should return true for a valid VC", async () => {
        const result = await vcValidationModule.validateVC(sVC, publicKey);
        expect(result).toBe(true);
  });
});