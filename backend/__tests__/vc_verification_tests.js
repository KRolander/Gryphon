const request = require("supertest");
const vcValidationModule = require("../routes/vc");
// const { fetchRegistry } = require("../utility/VCUtils.js");
// const { startGateway, getGateway, getDIDDoc, getContract, getMap } = require('../gateway');
const { default: DIDDocumentBuilder } = require("../../utils/DIDDocumentBuilder.js");
const { VCBuilder, UnsignedVCBuilder } = require("../../utils/VC");
const { saveRegistryFromMap, loadRegistryAsMap, addVC } = require("../../utils/publicRegistry");
const { createSign } = require("crypto");
const crypto = require("crypto");
const canonicalize = require("canonicalize");

jest.mock("../gateway", () => ({
  startGateway: jest.fn(),
  getGateway: jest.fn(() => true),
  getContract: jest.fn(() => ({
    /* mock contract object */
  })),
  getDIDDoc: jest.fn(), // define, but override later
  getMap: jest.fn(),
}));

const { startGateway, getGateway, getDIDDoc, getContract, getMap } = require("../gateway");

jest.mock("../utility/VCUtils", () => ({
  fetchRegistry: jest.fn(),
}));
const { fetchRegistry } = require("../utility/VCUtils");

/**---------Create the map with required authorizations--------- */
const map = new Map();
map.set("BachelorDegree", "DiplomaIssuing"); // for someone to issue a VC for a BachelorDegree they need a DiplomaIssuing VC
map.set("DiplomaIssuing", "Authorization"); // for someone to issue a VC for a DiplomaIssuing they need am Authorization VC

/**---------Create the key pair for the student--------- */
let { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "P-256",
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

const publicKeyStudent = publicKey;
const privateKeyStudent = privateKey;

/**---------Create the key pair for the university--------- */
({ publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "P-256",
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
}));

const publicKeyUni = publicKey;
const privateKeyUni = privateKey;

/**---------Create the key pair for the root--------- */
({ publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "P-256",
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
}));

const publicKeyRoot = publicKey;
const privateKeyRoot = privateKey;

const studentDID = "did:hlf:student";
const uniDID = "did:hlf:university";
const rootDID = "did:hlf:root";
/**---------Create the DID Document of the student--------- */
const docBuilderStudent = new DIDDocumentBuilder(studentDID, studentDID, publicKeyStudent, null);
const uniURL = "http://localhost:3000/registry/university";
const rootURL = "http://localhost:3000/registry/MOE";
/**---------Create the DID Document of the university--------- */
const docBuilderUni = new DIDDocumentBuilder(uniDID, uniDID, publicKeyUni, uniURL);

/**---------Create the DID Document of the root--------- */
const docBuilderRoot = new DIDDocumentBuilder(rootDID, rootDID, publicKeyRoot, rootURL);

const studentDoc = docBuilderStudent.build();
const uniDoc = docBuilderUni.build();
const rootDoc = docBuilderRoot.build();

describe("POST /vc/verifyDeep", () => {
  afterEach(() => {
    const fs = require("fs");
    fs.writeFileSync("../registries/MOE.json", JSON.stringify({}));
    fs.writeFileSync("../registries/university.json", JSON.stringify({}));
  });
  it("should return 200 and a valid message", async () => {
    getDIDDoc.mockImplementation((_, arg) => {
      if (arg === studentDID) return studentDoc;
      if (arg === uniDID) return uniDoc;
      if (arg === rootDID) return rootDoc;
      return "unknown";
    });

    console.log(loadRegistryAsMap("../registries/university.json"));

    getMap.mockResolvedValue(map);
    const studentVCClaims = {
      degree: "Bachelor of Science",
      graduationYear: 2024,
    };

    const universityVCClaims = {
      degree: "Yeah, pretty cool that I can issue Diplomas and stuff",
      graduationYear: 2024,
    };

    const rootVCClaims = {
      degree: "I HOLD ALL THE POWER",
      graduationYear: 2024,
    };

    /**---------Create the unsigne VC for student--------- */
    const studentuVCBuilder = new UnsignedVCBuilder(
      "BachelorDegree",
      "date",
      uniDID,
      studentDID,
      studentVCClaims
    );
    const studentuVC = studentuVCBuilder.build();

    /**---------Create the studentVC signature--------- */
    const canonStudent = canonicalize(studentuVC);
    const signer1 = createSign("SHA256");
    signer1.update(canonStudent);
    signer1.end();
    const signatureStudentVC = signer1.sign(privateKeyUni, "base64");
    const studentsVCBuilder = new VCBuilder(studentuVC, "date1", "someURL", signatureStudentVC);
    const studentsVC = studentsVCBuilder.build();

    console.log(signatureStudentVC);

    /**---------Create the unsigne VC for university--------- */
    const uniuVCBuilder = new UnsignedVCBuilder(
      "DiplomaIssuing",
      "date",
      rootDID,
      uniDID,
      universityVCClaims
    );
    const uniuVC = uniuVCBuilder.build();

    /**---------Create the universityVC signature--------- */
    const canonUniversity = canonicalize(uniuVC);
    const signer2 = createSign("SHA256");
    signer2.update(canonUniversity);
    signer2.end();
    const signatureUniVC = signer2.sign(privateKeyRoot, "base64");
    const unisVCBuilder = new VCBuilder(uniuVC, "date1", "someURL", signatureUniVC);

    console.log(signatureUniVC);
    const unisVC = unisVCBuilder.build();

    /**---------Create the unsigne VC for root--------- */
    const rootuVCBuilder = new UnsignedVCBuilder(
      "Authorization",
      "date",
      rootDID,
      rootDID,
      rootVCClaims
    );
    const rootuVC = rootuVCBuilder.build();

    /**---------Create the universityVC signature--------- */
    const canonRoot = canonicalize(rootuVC);
    const signer3 = createSign("SHA256");
    signer3.update(canonRoot);
    signer3.end();
    const signatureRootVC = signer3.sign(privateKeyRoot, "base64");
    const rootsVCBuilder = new VCBuilder(rootuVC, "date1", "someURL", signatureRootVC);

    const rootsVC = rootsVCBuilder.build();

    /**---------Add the university VC to its public registry--------- */
    let regUni = loadRegistryAsMap("../registries/university.json");
    addVC(regUni, unisVC);
    saveRegistryFromMap(regUni, "../registries/university.json");

    /**---------Add the root VC to its public registry--------- */
    let regRoot = loadRegistryAsMap("../registries/MOE.json");
    addVC(regRoot, rootsVC);
    saveRegistryFromMap(regRoot, "../registries/MOE.json");

    fetchRegistry.mockImplementation((url) => {
      if (url == uniURL) return loadRegistryAsMap("../registries/university.json");
      if (url == rootURL) return loadRegistryAsMap("../registries/MOE.json");
      return url;
    });

    // import it here because we need the registries to be populated first
    const app = require("../app");
    const response = await request(app).post("/vc/verifyDeep").send(studentsVC).expect(200);

    expect(response.text).toBe("The VC is valid");

    // TODO: delete the contents of the registry
  });
});
