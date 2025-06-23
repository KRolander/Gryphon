const { VCBuilder, UnsignedVCBuilder } = require("../../utils/VC");
const vcValidationModule = require("../routes/vc");
const canonicalize = require("canonicalize");
const { saveRegistryFromMap, loadRegistryAsMap, addVC } = require("../../utils/publicRegistry");
const { sign, generateKeys } = require("../utility/VCUtils");

let sVC;
let badVC;
let publicKey;
let privateKey;

describe("validateVC", () => {
  beforeAll(async () => {
    /**---------Create the key pair for the test--------- */
    const keys = await generateKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;

    /**---------Create the unsigned VC--------- */
    const issuerDID = "did:hlf:issuer";
    const subDID = "did:hlf:subject";
    const uVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential"],
      "date",
      issuerDID,
      subDID,
      "claim"
    );
    const baduVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential"],
      "date",
      "did:hlf:somedid",
      subDID,
      "claim"
    );
    const uVC = uVCBuilder.build();
    const baduVC = baduVCBuilder.build();

    /**---------Create the signature--------- */
    const canon = canonicalize(uVC);
    const signature = await sign(canon, privateKey);

    /**---------Sign the VC--------- */
    const sVCBuilder = new VCBuilder(uVC, "date1", "someURL", signature);
    const badVCBuilder = new VCBuilder(baduVC, "date1", "someURL", signature);
    sVC = sVCBuilder.build();
    badVC = badVCBuilder.build();
  });

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
