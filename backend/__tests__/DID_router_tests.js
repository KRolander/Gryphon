const mockBuild = jest.fn(() => ({ id: 'testDoc' }));
const mockConstructor = jest.fn().mockImplementation(function (DID, controllers, publicKey) {
    return {
        build: mockBuild
    };
});
jest.mock('../../utils/DIDDocumentBuilder', () => ({
    default: mockConstructor,
}));

const request = require('supertest');
const { startGateway, getGateway, getContract, storeDID } = require('../gateway');
const app = require("../app");
const {createDID} = require("../utility/DIDUtils");
const DIDDocumentBuilder  = require('../../utils/DIDDocumentBuilder');

jest.mock('../gateway', () => ({
    startGateway: jest.fn(),
    getGateway: jest.fn(() => true),
    getContract: jest.fn(() => ({ /* mock contract object */ })),
    storeDID: jest.fn(),
}));

jest.mock('../utility/DIDUtils', () => ({
    createDID: jest.fn(),
}));

describe("POST/did/create", ()=>{
    const publicKey = 'testKey';
    const DID = 'did:hlf:testDID';
    const doc = 'testDoc';
    const contract = {};

    beforeEach(() => {
        jest.clearAllMocks(); // Reset mocks before each test so previous calls don't affect new ones
        createDID.mockResolvedValue(DID);
        storeDID.mockResolvedValue(doc);
        getContract.mockReturnValue(contract);
        mockBuild.mockReturnValue(doc);
    });
    describe("testing returned values",() => {
        it("should return 200 and a valid message ", async () => {

            const response = await request(app)
                .post("/did/create")
                .send({publicKey});

            /**---------Verify actual result--------- */
            expect(response.status).toBe(200);
            expect(response.text).toBe(DID);
        });

        it("should return 400 - no public key", async () => {

            const response = await request(app)
                .post("/did/create")
                .send({});

            /**---------Verify actual result--------- */
            expect(response.status).toBe(400);
            expect(response.text).toBe('Public key is required');
        });

        it("should return 500 - storeDID error", async () => {

            storeDID.mockImplementation(()=>{
                throw new Error('Storing DID failed')
            });

            const response = await request(app)
                .post("/did/create")
                .send({publicKey});

            /**---------Verify actual result--------- */
            expect(response.status).toBe(500);
            expect(response.text).toBe('Error storing DID on the blockchain');
        });
    });

    describe("testing function calls",() => {

        describe("gateway not null", () => {
            beforeEach(async () => {
                await request(app)
                    .post("/did/create")
                    .send({publicKey});
            });

            it("gateway calls", async () => {
                expect(getGateway.mock.calls.length).toBe(1);
                expect(startGateway).not.toHaveBeenCalled();
            });

            it("did logic calls", async () => {
                expect(createDID.mock.calls.length).toBe(1);
                expect(storeDID.mock.calls.length).toBe(1);
                expect(storeDID).toHaveBeenCalledWith(contract,DID,doc);
            });

            it ("did doc creation calls", async () => {
                expect(mockConstructor.mock.calls.length).toBe(1);
                expect(mockBuild.mock.calls.length).toBe(1);
                expect(mockConstructor).toHaveBeenCalledWith(DID,DID,publicKey);
            });
        });

        it("gateway calls - gateway null", async () => {
            getGateway.mockReturnValue(null);
            await request(app)
                .post("/did/create")
                .send({publicKey});
            expect(getGateway.mock.calls.length).toBe(1);
            expect(startGateway.mock.calls.length).toBe(1);
        });
    });

});

