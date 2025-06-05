const { VCBuilder, UnsignedVCBuilder } = require("../../utils/VC");
const vcValidationModule = require("../routes/vc");
const { createSign } = require("crypto");
const crypto = require("crypto");
const canonicalize = require("canonicalize");
const {saveRegistryFromMap, loadRegistryAsMap, addVC} = require("../../utils/publicRegistry");

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

    /**---------Create the unsigned VC--------- */
    const issuerDID = "did:hlf:issuer";
    const subDID = "did:hlf:subject";
    const claims = {
        degree: "Bachelor of Science",
        graduationYear: 2024
    };
    const uVCBuilder = new UnsignedVCBuilder(["VerifiableCredential", "BachelorDegree"], "date", issuerDID, subDID, claims);
    const baduVCBuilder = new UnsignedVCBuilder("VerifiableCredential", "date", "did:hlf:somedid", subDID, claims);
    const uVC = uVCBuilder.build();
    const baduVC = baduVCBuilder.build();

    /**---------Create the signature--------- */
    const canon = canonicalize(uVC);
    const signer = createSign('SHA256');
    signer.update(canon);
    signer.end();
    const signature = signer.sign(privateKey, 'base64');

    /**---------Sign the VC--------- */
    const sVCBuilder = new VCBuilder(uVC, "date1", "someURL", signature);
    const badVCBuilder = new VCBuilder(baduVC, "date1", "someURL", signature);
    const sVC = sVCBuilder.build();
    const badVC = badVCBuilder.build();

    // this part was only added here in order to check if it is possible to populate the repository of the university
    // let reg = loadRegistryAsMap('../registries/university.json');
    // addVC(reg, sVC);
    // saveRegistryFromMap(reg, "../registries/university.json");

    /**---------Check the result--------- */
    it("should return true for a valid VC", async () => {
        const result = await vcValidationModule.validateVC(sVC, publicKey);
        expect(result).toBe(true);
    });

    it("should return false for an invalid VC", async () => {
        const result = await vcValidationModule.validateVC(badVC, publicKey);
        expect(result).toBe(false);
    });
});