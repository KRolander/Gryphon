const request = require("supertest");
const app = require("../app");
const vcValidationModule = require("../routes/vc");
const { startGateway, getGateway, getDIDDoc, getContract } = require("../gateway");
const { default: DIDDocumentBuilder } = require("../../utils/DIDDocumentBuilder.js");
const { VCBuilder, UnsignedVCBuilder } = require("../../utils/VC");
const canonicalize = require("canonicalize");
const { sign, generateKeys } = require("../utility/VCUtils.js");

jest.mock("../gateway", () => ({
  startGateway: jest.fn(),
  getGateway: jest.fn(() => true),
  getContract: jest.fn(() => ({
    /* mock contract object */
  })),
  getDIDDoc: jest.fn(), // define, but override later
}));

let publicKey, privateKey;
const issuerDID = "did:hlf:issuer";
let doc, keylessDoc;

describe("POST /vc/verify", () => {
  beforeAll(async () => {
    /**---------Create the key pair for the test--------- */
    ({ publicKey, privateKey } = await generateKeys());
    const issuerDID = "did:hlf:issuer";
    /**---------Create the DID Document of the issuer--------- */
    const docBuilder = new DIDDocumentBuilder(issuerDID, issuerDID, publicKey, null);
    const noKeyBuilder = new DIDDocumentBuilder(issuerDID, issuerDID, null, null);
    //this will be the doc of the issuer
    doc = docBuilder.build();
    keylessDoc = noKeyBuilder.build();
  });

  it("should return 200 and a valid message", async () => {
    getDIDDoc.mockReturnValue(doc);

    /**---------Create the unsigne VC--------- */
    const subDID = "did:hlf:subject";
    const uVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential", "something else"],
      "date",
      issuerDID,
      subDID,
      "claim"
    );
    const uVC = uVCBuilder.build();

    /**---------Create the signature--------- */
    const canon = canonicalize(uVC);
    const signature = await sign(canon, privateKey);

    /**---------Sign the VC--------- */
    const sVCBuilder = new VCBuilder(uVC, "date1", "someURL", signature);

    const sVC = sVCBuilder.build();
    const keyId = doc.assertionMethod[0]; // get the id of the key used for the assertion method
    const method = doc.verificationMethod.find((vm) => vm.id === keyId); // find that method in the list of verification methods

    //if(!pkId)
    const pk = method.publicKey;
    //const result = await vcValidationModule.validateVC(sVC, pk);
    //console.log(result);

    const response = await request(app).post("/vc/verify").send(sVC).expect(200);

    expect(response.text).toBe("The VC is valid (it was issued by the issuer)");
  });

  it("should return 400 because there is no VC", async () => {
    const response = await request(app).post("/vc/verify").send(null).expect(400);

    expect(response.text).toBe("VC required");
  });

  it("should return 500 because the issuer is not valid", async () => {
    getDIDDoc.mockReturnValue(null);
    /**---------Create the unsigne VC--------- */
    const subDID = "did:hlf:subject";
    const uVCBuilder = new UnsignedVCBuilder(
      "VerifiableCredential",
      "date",
      issuerDID,
      subDID,
      "claim"
    );
    const uVC = uVCBuilder.build();

    /**---------Create the signature--------- */
    const canon = canonicalize(uVC);
    const signature = await sign(canon, privateKey);

    /**---------Sign the VC--------- */
    const sVCBuilder = new VCBuilder(uVC, "date1", "someURL", signature);

    const sVC = sVCBuilder.build();

    const response = await request(app).post("/vc/verify").send(sVC).expect(500);

    expect(response.text).toBe("The DID does not exist");
  });

  it("should return 400 because the issuer does not have a public key", async () => {
    getDIDDoc.mockReturnValue(keylessDoc);
    /**---------Create the unsigne VC--------- */
    const subDID = "did:hlf:subject";
    const uVCBuilder = new UnsignedVCBuilder(
      "VerifiableCredential",
      "date",
      issuerDID,
      subDID,
      "claim"
    );
    const uVC = uVCBuilder.build();

    /**---------Create the signature--------- */
    const canon = canonicalize(uVC);
    const signature = await sign(canon, privateKey);

    /**---------Sign the VC--------- */
    const sVCBuilder = new VCBuilder(uVC, "date1", "someURL", signature);

    const sVC = sVCBuilder.build();

    const response = await request(app).post("/vc/verify").send(sVC).expect(400);

    expect(response.text).toBe("This DID does not have a public key");
  });

  it("should return 200 but it should be false because the VC is not valid", async () => {
    getDIDDoc.mockReturnValue(doc);
    /**---------Create the unsigne VC--------- */
    const subDID = "did:hlf:subject";
    const uVCBuilder = new UnsignedVCBuilder(
      "VerifiableCredential",
      "date",
      issuerDID,
      subDID,
      "claim"
    );
    const uVC = uVCBuilder.build();

    /**---------Sign the VC--------- */
    const signature = await sign("signature", privateKey);
    const sVCBuilder = new VCBuilder(uVC, "date1", "someURL", signature);

    const sVC = sVCBuilder.build();
    const keyId = doc.assertionMethod[0]; // get the id of the key used for the assertion method
    const method = doc.verificationMethod.find((vm) => vm.id === keyId); // find that method in the list of verification methods
    const response = await request(app).post("/vc/verify").send(sVC).expect(200);

    expect(response.text).toBe("The VC is not valid (it was not issued by the issuer)");
  });
});
