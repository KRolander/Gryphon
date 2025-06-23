const request = require("supertest");
const vcValidationModule = require("../routes/vc");
const fs = require("fs");
// const { fetchRegistry } = require("../utility/VCUtils.js");
// const { startGateway, getGateway, getDIDDoc, getContract, getMap } = require('../gateway');
const { default: DIDDocumentBuilder } = require("../../utils/DIDDocumentBuilder.js");
const { VCBuilder, UnsignedVCBuilder } = require("../../utils/VC");
const { saveRegistryFromMap, loadRegistryAsMap, addVC } = require("../../utils/publicRegistry");
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

const {
  fetchRegistry,
  isRoot,
  universityTestPath,
  moeTestPath,
  generateKeys,
  sign,
} = require("../utility/VCUtils");

/**---------Create the key pair for the student--------- */
let publicKey, privateKey;

let publicKeyStudent;
let privateKeyStudent;

let publicKeyUni;
let privateKeyUni;

let publicKeyMar;
let privateKeyMar;

let publicKeyRoot;
let privateKeyRoot;

const studentDID = "did:hlf:student";
const uniDID = "did:hlf:university";
const rootDID = "did:hlf:root";
const marDID = "did:hlf:maroi";

const uniURL = "http://localhost:3000/registry/university";
const rootURL = "http://localhost:3000/registry/MOE";
const marURL = "just me";

let studentDoc;
let keylessStudentDoc;
let uniDoc;
let rootDoc;
let marDoc;

describe("POST /vc/verifyTrustchain", () => {
  beforeAll(async () => {
    /**---------Create the key pair for the student--------- */
    ({ publicKey, privateKey } = await generateKeys());

    publicKeyStudent = publicKey;
    privateKeyStudent = privateKey;

    /**---------Create the key pair for the university--------- */
    ({ publicKey, privateKey } = await generateKeys());

    publicKeyUni = publicKey;
    privateKeyUni = privateKey;

    /**---------Create the key pair for a malicious user (Maroi)--------- */
    ({ publicKey, privateKey } = await generateKeys());

    publicKeyMar = publicKey;
    privateKeyMar = privateKey;

    /**---------Create the key pair for the root--------- */
    ({ publicKey, privateKey } = await generateKeys());

    publicKeyRoot = publicKey;
    privateKeyRoot = privateKey;

    /**---------Create the DID Document of the student--------- */
    const docBuilderStudent = new DIDDocumentBuilder(
      studentDID,
      studentDID,
      publicKeyStudent,
      null
    );
    const keylessdocBuilderStudent = new DIDDocumentBuilder(studentDID, studentDID, null, null);

    /**---------Create the DID Document of the university--------- */
    const docBuilderUni = new DIDDocumentBuilder(uniDID, uniDID, publicKeyUni, uniURL);

    /**---------Create the DID Document of the root--------- */
    const docBuilderRoot = new DIDDocumentBuilder(rootDID, rootDID, publicKeyRoot, rootURL);

    /**---------Create the DID Document of the Maroi--------- */
    const docBuilderMaroi = new DIDDocumentBuilder(marDID, marDID, publicKeyMar, marURL);

    studentDoc = docBuilderStudent.build();
    keylessStudentDoc = keylessdocBuilderStudent.build();
    uniDoc = docBuilderUni.build();
    rootDoc = docBuilderRoot.build();
    marDoc = docBuilderMaroi.build();
  });

  afterEach(() => {
    const fs = require("fs");
    fs.writeFileSync("./registries/MOE_test.json", JSON.stringify({}));
    fs.writeFileSync("./registries/university_test.json", JSON.stringify({}));
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
    const signatureStudentVC = await sign(canonStudent, privateKeyUni);
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
    const signatureUniVC = await sign(canonUniversity, privateKeyRoot);
    console.log(signatureUniVC);
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
    const signatureRootVC = await sign(canonRoot, privateKeyRoot);
    const rootsVCBuilder = new VCBuilder(rootuVC, "date1", "someURL", signatureRootVC);

    const rootsVC = rootsVCBuilder.build();

    /**---------Add the university VC to its public registry--------- */
    let regUni = loadRegistryAsMap(universityTestPath);
    addVC(regUni, unisVC);
    saveRegistryFromMap(regUni, universityTestPath);

    /**---------Add the root VC to its public registry--------- */
    let regRoot = loadRegistryAsMap(moeTestPath);
    addVC(regRoot, rootsVC);
    saveRegistryFromMap(regRoot, moeTestPath);

    fetchRegistry.mockImplementation((url) => {
      if (url == uniURL) return JSON.parse(fs.readFileSync(universityTestPath, "utf-8"));
      if (url == rootURL) return JSON.parse(fs.readFileSync(moeTestPath, "utf-8"));
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
    const signatureStudentVC = await sign(canonStudent, privateKeyUni);
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
    const signatureStudentVC = await sign(canonStudent, privateKeyUni);
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
    const signatureUniVC = await sign(canonUniversity, privateKeyRoot);
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
    const signatureRootVC = await sign(canonRoot, privateKeyRoot);
    const rootsVCBuilder = new VCBuilder(rootuVC, "date1", "someURL", signatureRootVC);

    const rootsVC = rootsVCBuilder.build();

    /**---------Add the university VC to its public registry--------- */
    let regUni = loadRegistryAsMap(universityTestPath);
    addVC(regUni, unisVC);
    saveRegistryFromMap(regUni, universityTestPath);

    /**---------Add the root VC to its public registry--------- */
    let regRoot = loadRegistryAsMap(moeTestPath);
    addVC(regRoot, rootsVC);
    saveRegistryFromMap(regRoot, moeTestPath);

    fetchRegistry.mockImplementation((url) => {
      if (url == uniURL) return JSON.parse(fs.readFileSync(universityTestPath, "utf-8"));
      if (url == rootURL) return JSON.parse(fs.readFileSync(moeTestPath, "utf-8"));
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
    const signatureStudentVC = await sign(canonStudent, privateKeyUni);
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
    const signatureUniVC = await sign(canonUniversity, privateKeyRoot);
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
    const signatureRootVC = await sign(canonRoot, privateKeyRoot);
    const rootsVCBuilder = new VCBuilder(rootuVC, "date1", "someURL", signatureRootVC);

    const rootsVC = rootsVCBuilder.build();

    /**---------Add the university VC to its public registry--------- */
    let regUni = loadRegistryAsMap(universityTestPath);
    addVC(regUni, unisVC);
    saveRegistryFromMap(regUni, universityTestPath);

    /**---------Add the root VC to its public registry--------- */
    let regRoot = loadRegistryAsMap(moeTestPath);
    addVC(regRoot, rootsVC);
    saveRegistryFromMap(regRoot, moeTestPath);

    fetchRegistry.mockImplementation((url) => {
      if (url == uniURL) return JSON.parse(fs.readFileSync(universityTestPath, "utf-8"));
      if (url == rootURL) return JSON.parse(fs.readFileSync(moeTestPath, "utf-8"));
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

  // it("should return 200 but fail because the VC was (probably) stolen", async () => {
  //   getDIDDoc.mockImplementation((_, arg) => {
  //     if (arg === studentDID) return studentDoc;
  //     if (arg === uniDID) return uniDoc;
  //     if (arg === rootDID) return rootDoc;
  //     if (arg === marDID) return marDoc;
  //     return "unknown";
  //   });

  //   // console.log(loadRegistryAsMap("../registries/university.json"));

  //   getMapValue.mockImplementation((_, value) => {
  //     if (value === "BachelorDegree") return "DiplomaIssuing";
  //     if (value === "DiplomaIssuing") return "Authorization";
  //     return "unknown";
  //   });
  //   const studentVCClaims = {
  //     degree: "Bachelor of Science",
  //     graduationYear: 2024,
  //   };

  //   const universityVCClaims = {
  //     degree: "Yeah, pretty cool that I can issue Diplomas and stuff",
  //     graduationYear: 2024,
  //   };

  //   const rootVCClaims = {
  //     degree: "I HOLD ALL THE POWER",
  //     graduationYear: 2024,
  //   };

  //   /**---------Create the unsigne VC for student--------- */
  //   const studentuVCBuilder = new UnsignedVCBuilder(
  //     ["VerifiableCredential", "BachelorDegree"],
  //     "date",
  //     marDID,
  //     studentDID,
  //     studentVCClaims
  //   );
  //   const studentuVC = studentuVCBuilder.build();

  //   /**---------Create the studentVC signature--------- */
  //   const canonStudent = canonicalize(studentuVC);
  //   const signer1 = createSign("SHA256");
  //   signer1.update(canonStudent);
  //   signer1.end();
  //   const signatureStudentVC = signer1.sign(privateKeyMar, "base64");
  //   const studentsVCBuilder = new VCBuilder(studentuVC, "date1", "someURL", signatureStudentVC);
  //   const studentsVC = studentsVCBuilder.build();

  //   //console.log(signatureStudentVC);

  //   /**---------Create the unsigne VC for university--------- */
  //   const uniuVCBuilder = new UnsignedVCBuilder(
  //     ["VerifiableCredential", "DiplomaIssuing"],
  //     "date",
  //     rootDID,
  //     uniDID,
  //     universityVCClaims
  //   );
  //   const uniuVC = uniuVCBuilder.build();

  //   /**---------Create the universityVC signature--------- */
  //   const canonUniversity = canonicalize(uniuVC);
  //   const signer2 = createSign("SHA256");
  //   signer2.update(canonUniversity);
  //   signer2.end();
  //   const signatureUniVC = signer2.sign(privateKeyRoot, "base64");
  //   const unisVCBuilder = new VCBuilder(uniuVC, "date1", "someURL", signatureUniVC);

  //   //console.log(signatureUniVC);
  //   const unisVC = unisVCBuilder.build();

  //   /**---------Create the unsigne VC for root--------- */
  //   const rootuVCBuilder = new UnsignedVCBuilder(
  //     ["VerifiableCredential", "Authorization"],
  //     "date",
  //     rootDID,
  //     rootDID,
  //     rootVCClaims
  //   );
  //   const rootuVC = rootuVCBuilder.build();

  //   /**---------Create the rootVC signature--------- */
  //   const canonRoot = canonicalize(rootuVC);
  //   const signer3 = createSign("SHA256");
  //   signer3.update(canonRoot);
  //   signer3.end();
  //   const signatureRootVC = signer3.sign(privateKeyRoot, "base64");
  //   const rootsVCBuilder = new VCBuilder(rootuVC, "date1", "someURL", signatureRootVC);

  //   const rootsVC = rootsVCBuilder.build();

  //   /**---------Add the university VC to its public registry--------- */
  //   let regUni = loadRegistryAsMap(universityTestPath);
  //   addVC(regUni, unisVC);
  //   saveRegistryFromMap(regUni, universityTestPath);

  //   /**---------Add the root VC to its public registry--------- */
  //   let regRoot = loadRegistryAsMap(moeTestPath);
  //   addVC(regRoot, rootsVC);
  //   saveRegistryFromMap(regRoot, moeTestPath);

  //   /**---------Add the stolen VC to Maroi's public registry--------- */
  //   let marMap = new Map();
  //   marMap.set(marDID, [unisVC]);

  //   const obj = Object.fromEntries(marMap);
  // const marReg = JSON.stringify(obj);

  //   fetchRegistry.mockImplementation((url) => {
  //     if (url == uniURL) return loadRegistryAsMap(universityTestPath);
  //     if (url == rootURL) return loadRegistryAsMap(moeTestPath);
  //     if (url == marURL) return marReg;
  //     return url;
  //   });

  //   isRoot.mockImplementation((did) => {
  //     if (did === "did:hlf:root") return true;
  //     return false;
  //   });

  //   // import it here because we need the registries to be populated first
  //   const app = require("../app");
  //   const response = await request(app).post("/vc/verifyTrustchain").send(studentsVC).expect(200);

  //   expect(response.text).toBe(
  //     "There was a problem up the trustchain. It is possible that a third party took unauthorized control of another VC"
  //   );
  // });

  it("should return 400 because no VC was provided", async () => {
    const app = require("../app");
    const response = await request(app).post("/vc/verifyTrustchain").send(null).expect(400);

    expect(response.text).toBe("VC required");
  });
});
