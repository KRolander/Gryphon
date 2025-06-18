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
  getDIDDoc: jest.fn(),
  getMapValue: jest.fn(),
}));

const { startGateway, getGateway, getDIDDoc, getContract, getMapValue } = require("../gateway");

jest.mock("../utility/VCUtils", () => {
  const actual = jest.requireActual("../utility/VCUtils");
  return {
    ...actual,
    isRoot: jest.fn(),
    fetchRegistry: jest.fn(),
  };
});

const { fetchRegistry, isRoot } = require("../utility/VCUtils");

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

/**---------Create the key pair for a malicious user--------- */
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

const publicKeyMar = publicKey;
const privateKeyMar = privateKey;

const publicKeyRoot = publicKey;
const privateKeyRoot = privateKey;

const studentDID = "did:hlf:student";
const uniDID = "did:hlf:university";
const rootDID = "did:hlf:root";
const malDID = "did:hlf:maroi";

const uniURL = "http://localhost:3000/registry/university";
const rootURL = "http://localhost:3000/registry/MOE";
const marURL = "just me";

/**---------Create the DID Document of the student--------- */
const docBuilderStudent = new DIDDocumentBuilder(studentDID, studentDID, publicKeyStudent, null);
const keylessdocBuilderStudent = new DIDDocumentBuilder(studentDID, studentDID, null, null);

/**---------Create the DID Document of the university--------- */
const docBuilderUni = new DIDDocumentBuilder(uniDID, uniDID, publicKeyUni, uniURL);

/**---------Create the DID Document of the root--------- */
const docBuilderRoot = new DIDDocumentBuilder(rootDID, rootDID, publicKeyRoot, rootURL);

/**---------Create the DID Document of the Maroi--------- */
const docBuilderMaroi = new DIDDocumentBuilder(malDID, malDID, publicKeyMar, marURL);

const studentDoc = docBuilderStudent.build();
const keylessStudentDoc = keylessdocBuilderStudent.build();
const uniDoc = docBuilderUni.build();
const rootDoc = docBuilderRoot.build();
const malDoc = docBuilderMaroi.build();

describe("POST /vc/verifyTrustchain", () => {
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

    // console.log(loadRegistryAsMap("../registries/university.json"));

    getMapValue.mockImplementation((_, value) => {
      if (value === "BachelorDegree") return "DiplomaIssuing";
      if (value === "DiplomaIssuing") return "Authorization";
      return "unknown";
    });
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
      ["VerifiableCredential", "BachelorDegree"],
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

    //console.log(signatureStudentVC);

    /**---------Create the unsigne VC for university--------- */
    const uniuVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential", "DiplomaIssuing"],
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

    //console.log(signatureUniVC);
    const unisVC = unisVCBuilder.build();

    /**---------Create the unsigne VC for root--------- */
    const rootuVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential", "Authorization"],
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

    isRoot.mockImplementation((did) => {
      if (did === "did:hlf:root") return true;
      return false;
    });

    // import it here because we need the registries to be populated first
    const app = require("../app");
    const response = await request(app).post("/vc/verifyTrustchain").send(studentsVC).expect(200);

    expect(response.text).toBe("The VC is valid");
  });

  it("should return 400 because no VC was provided", async () => {
    const app = require("../app");
    const response = await request(app).post("/vc/verifyTrustchain").send(null).expect(400);

    expect(response.text).toBe("VC required");
  });

  it("should return 400 because the type of the first VC does not include Verifiable Credential", async () => {
    // console.log(loadRegistryAsMap("../registries/university.json"));

    getMapValue.mockImplementation((_, value) => {
      if (value === "BachelorDegree") return "DiplomaIssuing";
      if (value === "DiplomaIssuing") return "Authorization";
      return "unknown";
    });
    const studentVCClaims = {
      degree: "Bachelor of Science",
      graduationYear: 2024,
    };
    /**---------Create the unsigne VC for student--------- */
    const studentuVCBuilder = new UnsignedVCBuilder(
      ["BachelorDegree"],
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

    //console.log(signatureStudentVC);

    isRoot.mockImplementation((did) => {
      if (did === "did:hlf:root") return true;
      return false;
    });

    const app = require("../app");
    const response = await request(app).post("/vc/verifyTrustchain").send(studentsVC).expect(400);

    expect(response.text).toBe(
      `The VC owned by ${studentDID} does not have the correct type(VerifiableCredential)`
    );
  });

  it("should return 200 but invalid VC because the VC of the user is not valid", async () => {
    getDIDDoc.mockImplementation((_, arg) => {
      if (arg === studentDID) return studentDoc;
      if (arg === uniDID) return uniDoc;
      if (arg === rootDID) return rootDoc;
      return "unknown";
    });

    // console.log(loadRegistryAsMap("../registries/university.json"));

    getMapValue.mockImplementation((_, value) => {
      if (value === "BachelorDegree") return "DiplomaIssuing";
      if (value === "DiplomaIssuing") return "Authorization";
      return "unknown";
    });
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
      ["VerifiableCredential", "BachelorDegree"],
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

    const badStudentuVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential", "BachelorDegree"],
      "date",
      studentDID,
      studentDID,
      studentVCClaims
    );

    const badStudentuVC = badStudentuVCBuilder.build();
    const badStudentsVCBuilder = new VCBuilder(
      badStudentuVC,
      "date1",
      "someURL",
      signatureStudentVC
    );
    const badStudentsVC = badStudentsVCBuilder.build();

    /**---------Create the unsigne VC for university--------- */
    const uniuVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential", "DiplomaIssuing"],
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

    //console.log(signatureUniVC);
    const unisVC = unisVCBuilder.build();

    /**---------Create the unsigne VC for root--------- */
    const rootuVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential", "Authorization"],
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

    isRoot.mockImplementation((did) => {
      if (did === "did:hlf:root") return true;
      return false;
    });

    // import it here because we need the registries to be populated first
    const app = require("../app");
    const response = await request(app)
      .post("/vc/verifyTrustchain")
      .send(badStudentsVC)
      .expect(200);

    expect(response.text).toBe(
      `The VC is invalid, as it was not signed by the issuer. ${studentDID}`
    );
  });

  it("should return 200 but should fail, because an institution up the trustchain doesn't have a valid VC", async () => {
    getDIDDoc.mockImplementation((_, arg) => {
      if (arg === studentDID) return studentDoc;
      if (arg === uniDID) return uniDoc;
      if (arg === rootDID) return rootDoc;
      return "unknown";
    });

    // console.log(loadRegistryAsMap("../registries/university.json"));

    getMapValue.mockImplementation((_, value) => {
      if (value === "BachelorDegree") return "DiplomaIssuing";
      if (value === "DiplomaIssuing") return "Authorization";
      return "unknown";
    });
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
      ["VerifiableCredential", "BachelorDegree"],
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

    /**---------Create the unsigne VC for university--------- */
    const uniuVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential", "NotWhatYouNeed"],
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

    //console.log(signatureUniVC);
    const unisVC = unisVCBuilder.build();

    /**---------Create the unsigne VC for root--------- */
    const rootuVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential", "Authorization"],
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

    isRoot.mockImplementation((did) => {
      if (did === "did:hlf:root") return true;
      return false;
    });

    // import it here because we need the registries to be populated first
    const app = require("../app");
    const response = await request(app).post("/vc/verifyTrustchain").send(studentsVC).expect(200);

    expect(response.text).toBe(
      `The VC is invalid, an organization up the trustchain didn't have the required permission did:hlf:university`
    );
  });

  it("should return 200 but fail because the VC was (probably) stolen", async () => {
    getDIDDoc.mockImplementation((_, arg) => {
      if (arg === studentDID) return studentDoc;
      if (arg === uniDID) return uniDoc;
      if (arg === rootDID) return rootDoc;
      if (arg === malDID) return malDoc;
      return "unknown";
    });

    // console.log(loadRegistryAsMap("../registries/university.json"));

    getMapValue.mockImplementation((_, value) => {
      if (value === "BachelorDegree") return "DiplomaIssuing";
      if (value === "DiplomaIssuing") return "Authorization";
      return "unknown";
    });
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
      ["VerifiableCredential", "BachelorDegree"],
      "date",
      malDID,
      studentDID,
      studentVCClaims
    );
    const studentuVC = studentuVCBuilder.build();

    /**---------Create the studentVC signature--------- */
    const canonStudent = canonicalize(studentuVC);
    const signer1 = createSign("SHA256");
    signer1.update(canonStudent);
    signer1.end();
    const signatureStudentVC = signer1.sign(privateKeyMar, "base64");
    const studentsVCBuilder = new VCBuilder(studentuVC, "date1", "someURL", signatureStudentVC);
    const studentsVC = studentsVCBuilder.build();

    //console.log(signatureStudentVC);

    /**---------Create the unsigne VC for university--------- */
    const uniuVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential", "DiplomaIssuing"],
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

    //console.log(signatureUniVC);
    const unisVC = unisVCBuilder.build();

    /**---------Create the unsigne VC for root--------- */
    const rootuVCBuilder = new UnsignedVCBuilder(
      ["VerifiableCredential", "Authorization"],
      "date",
      rootDID,
      rootDID,
      rootVCClaims
    );
    const rootuVC = rootuVCBuilder.build();

    /**---------Create the rootVC signature--------- */
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

    /**---------Add the stolen VC to Maroi's public registry--------- */
    let malReg = new Map();
    malReg.set(malDID, [unisVC]);

    fetchRegistry.mockImplementation((url) => {
      if (url == uniURL) return loadRegistryAsMap("../registries/university.json");
      if (url == rootURL) return loadRegistryAsMap("../registries/MOE.json");
      if (url == marURL) return malReg;
      return url;
    });

    isRoot.mockImplementation((did) => {
      if (did === "did:hlf:root") return true;
      return false;
    });

    // import it here because we need the registries to be populated first
    const app = require("../app");
    const response = await request(app).post("/vc/verifyTrustchain").send(studentsVC).expect(200);

    expect(response.text).toBe(
      "There was a problem up the trustchain. It is possible that a third party took unauthorized control of another VC"
    );
  });

  it("should return 400 because no VC was provided", async () => {
    const app = require("../app");
    const response = await request(app).post("/vc/verifyTrustchain").send(null).expect(400);

    expect(response.text).toBe("VC required");
  });
});
