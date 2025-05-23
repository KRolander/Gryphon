const fs = require("fs/promises");
const grpc = require("@grpc/grpc-js");
const crypto = require("crypto"); 
const { connect } = require("@hyperledger/fabric-gateway");

jest.mock("fs/promises");
jest.mock("@grpc/grpc-js");
jest.mock("@hyperledger/fabric-gateway");

const gatewayModule = require("../gateway"); // Adjust path if needed

describe("startGateway", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs
    fs.readFile.mockResolvedValue(Buffer.from("mock-content"));
    fs.readdir.mockResolvedValue(["mock.pem"]);

    // Mock gRPC
    grpc.credentials.createSsl = jest.fn().mockReturnValue("mockTlsCreds");
    grpc.Client = jest.fn().mockImplementation(() => "mockGrpcClient");
    jest.spyOn(crypto, "createPrivateKey").mockReturnValue("mockPrivateKey");

    const { signers } = require("@hyperledger/fabric-gateway");
    signers.newPrivateKeySigner = jest.fn().mockReturnValue("mockSigner");

    // Mock connect
    connect.mockReturnValue({
      getNetwork: () => ({
        getContract: () => "mockContract",
      }),
    });
  });

  it("should initialize gateway and contract", async () => {
    await gatewayModule.startGateway();

    // Check if connect() was called
    expect(connect).toHaveBeenCalled();

    // Check getNetwork and getContract are set up
    const contract = gatewayModule.getContract();
    expect(contract).toBe("mockContract");
  });
});
