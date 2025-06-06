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
const { startGateway, getGateway, getContract, storeDID, getDIDDoc, addDIDController, deleteDID} = require('../gateway');
const app = require("../app");
const {createDID} = require("../utility/DIDUtils");
const DIDDocumentBuilder  = require('../../utils/DIDDocumentBuilder');

jest.mock('../gateway', () => ({
    startGateway: jest.fn(),
    getGateway: jest.fn(() => true),
    getContract: jest.fn(() => ({ /* mock contract object */ })),
    storeDID: jest.fn(),
    getDIDDoc: jest.fn(),
    addDIDController: jest.fn(),
    deleteDID: jest.fn(),
}));

jest.mock('../utility/DIDUtils', () => ({
    createDID: jest.fn(),
}));

const publicKey = 'testKey';
const DID = 'did:hlf:testDID';

const contract = {};
const operation = "addController";
const newController = "did:hlf:testController";
let doc;
beforeEach(() => {
    doc = {
        DID: "docDID",
        controllers: [DID],
        publicKey: publicKey,
    }
    jest.clearAllMocks(); // Reset mocks before each test so previous calls don't affect new ones
    createDID.mockResolvedValue(DID);
    storeDID.mockResolvedValue(doc);
    getContract.mockReturnValue(contract);
    mockBuild.mockReturnValue(doc);
    getDIDDoc.mockResolvedValue(doc);
});
describe("POST/did/create", ()=>{

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

describe("GET/getDIDDoc/:did?", () =>{

    describe("testing returned values", () => {

        it ("should return 200 and a valid message", async() => {
            const response = await request(app)
                .get(`/did/getDIDDoc/${DID}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(doc);

        });

        it("should return 400 - no DID", async () => {
            const response = await request(app)
                .get(`/did/getDIDDoc/`);
            expect(response.status).toBe(400);
            expect(response.text).toBe('DID is required');
        });

        it ("should return 500 - getDIDDoc error", async () => {
            getDIDDoc.mockImplementation( () => {
                throw new Error("Error getting the document");
            })
            const response = await request(app)
                .get(`/did/getDIDDoc/${DID}`);
            expect(response.status).toBe(500);
            expect(response.text).toBe('Error querying DID from blockchain');
        });
    });

    describe("testing function calls", () => {

        describe("gateway not null", () => {

            beforeEach(async ()=> {
                getGateway.mockReturnValue(true);
                await request(app)
                    .get(`/did/getDIDDoc/${DID}`);
            });

            it("gateway calls", async () => {
                expect(getGateway.mock.calls.length).toBe(1);
                expect(startGateway).not.toHaveBeenCalled();
            });

            it ("DID document logic", async () => {
                expect(getDIDDoc.mock.calls.length).toBe(1);
                expect(getContract.mock.calls.length).toBe(1);
                expect(getDIDDoc).toHaveBeenCalledWith(contract,DID);
            });
        });

        it ("gateway calls - gateway null", async () => {
            getGateway.mockReturnValue(null);
            await request(app)
                .get(`/did/getDIDDoc/${DID}`);
            expect(getGateway.mock.calls.length).toBe(1);
            expect(startGateway.mock.calls.length).toBe(1);
        });
    });
});

describe("PATCH/updateDIDDoc/addController/:did?", () =>{

    describe("testing returned values", () => {

        it ("should return 200 and a valid message", async() => {
            const response = await request(app)
                .patch(`/did/updateDIDDoc/addController/${DID}`)
                .send({operation: operation, newController: newController});
            expect(response.status).toBe(200);
            expect(response.text).toBe('Controller added successfully');

        });

        it("should return 400 - no operation", async () => {
            const response = await request(app)
                .patch(`/did/updateDIDDoc/addController/${DID}`)
                .send({newController: newController});
            expect(response.status).toBe(400);
            expect(response.text).toBe('Invalid request');
        });

        it("should return 400 - invalid operation", async () => {
            const invalidOp = "invalid operation";
            const response = await request(app)
                .patch(`/did/updateDIDDoc/addController/${DID}`)
                .send({operation:invalidOp, newController: newController});
            expect(response.status).toBe(400);
            expect(response.text).toBe('Not yet implemented or operation not allowed');
        });

        it("should return 400 - invalid controller", async () => {
            const response = await request(app)
                .patch(`/did/updateDIDDoc/addController/${DID}`)
                .send({operation: operation});
            expect(response.status).toBe(400);
            expect(response.text).toBe('Invalid request');
        });

        it("should return 400 - no target DID", async () => {
            const response = await request(app)
                .patch(`/did/updateDIDDoc/addController/`)
                .send({operation: operation, newController: newController});
            expect(response.status).toBe(400);
            expect(response.text).toBe('No target DID');
        });

        it("should return 400 - no controller", async () => {
            getDIDDoc.mockImplementation(() => {
                throw new Error("There is no controller");
            })
            const response = await request(app)
                .patch(`/did/updateDIDDoc/addController/${DID}`)
                .send({operation: operation, newController: newController});
            expect(response.status).toBe(400);
            expect(response.text).toBe('No controller');
        });

        it("should return 400 - duplicate controller", async () => {

            const response = await request(app)
                .patch(`/did/updateDIDDoc/addController/${DID}`)
                .send({operation: operation, newController: DID});
            expect(response.status).toBe(400);
            expect(response.text).toBe(`DID ${DID} already has controller ${DID}`);
        });

        it ("should return 500 - getDIDDoc second application error", async () => {
            getDIDDoc.mockResolvedValueOnce(doc)
                .mockImplementationOnce(() => {
                    throw new Error("Error retrieving the document from blockchain:")
                })
            const response = await request(app)
                .patch(`/did/updateDIDDoc/addController/${DID}`)
                .send({operation: operation, newController: newController});
            expect(response.status).toBe(500);
            expect(response.text).toBe('Error querying DID from blockchain');
        });

        it ("should return 500 - addDIDController error", async () => {

            addDIDController.mockImplementationOnce(() => {
                    throw new Error("Failed to add controller");
                })
            const response = await request(app)
                .patch(`/did/updateDIDDoc/addController/${DID}`)
                .send({operation: operation, newController: newController});
            expect(response.status).toBe(500);
            expect(response.text).toBe('Error querying DID from blockchain');
        });
    });

    describe("testing function calls", () => {

        it ("good request - getDIDDoc calls", async () => {
            await request(app)
                .patch(`/did/updateDIDDoc/addController/${DID}`)
                .send({operation: operation, newController: newController});

            expect(getDIDDoc.mock.calls.length).toBe(2);
            expect(getDIDDoc.mock.calls[0]).toEqual([contract,newController]);
            expect(getDIDDoc.mock.calls[1]).toEqual([contract,DID]);

        });

        it ("good request - addDIDController and getContract calls", async () => {
            await request(app)
                .patch(`/did/updateDIDDoc/addController/${DID}`)
                .send({operation: operation, newController: newController});

            expect(addDIDController.mock.calls.length).toBe(1);
            expect(addDIDController).toHaveBeenCalledWith(contract,DID,doc);
            expect(getContract.mock.calls.length).toBe(3);

        });
    });

    it ("testing controller is added", async () => {
        expect(doc.controllers).not.toContain(newController);
        await request(app)
            .patch(`/did/updateDIDDoc/addController/${DID}`)
            .send({operation: operation, newController: newController});
        expect(doc.controllers).toContain(newController);
    });
});

describe("DELETE/deleteDID/:did?", () =>{

    describe("testing returned values", () => {

        it ("should return 200 and a valid message", async() => {
            const response = await request(app)
                .delete(`/did/deleteDID/${DID}`);
            expect(response.status).toBe(200);
            expect(response.text).toBe('DID deleted successfully');

        });

        it("should return 400 - no DID", async () => {
            const response = await request(app)
                .delete(`/did/deleteDID/`);
            expect(response.status).toBe(400);
            expect(response.text).toBe('DID is required');
        });

        it ("should return 404 - deleteDID error", async () => {
            deleteDID.mockImplementation( () => {
                const error = new Error("DID not found");
                error.details = [
                    {message: "it doesn't exist"}
                ];
                throw error;
            });
            const response = await request(app)
                .delete(`/did/deleteDID/${DID}`);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                reason: 'DID_NOT_FOUND',
                message: `DID ${DID} does not exist on-chain`,
            });
        });

        it ("should return 500 - deleteDID unknown error", async () => {
            deleteDID.mockImplementation( () => {
                throw new Error("Error");
            });
            const response = await request(app)
                .delete(`/did/deleteDID/${DID}`);
            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                reason: 'UNKNOWN_ERROR',
                message: 'Failed to delete DID',
            });
        });
    });

    describe("testing function calls", () => {

        describe("gateway not null", () => {

            beforeEach(async ()=> {
                getGateway.mockReturnValue(true);
                await request(app)
                    .delete(`/did/deleteDID/${DID}`);
            });

            it("gateway calls", async () => {
                expect(getGateway.mock.calls.length).toBe(1);
                expect(startGateway).not.toHaveBeenCalled();
            });

            it ("DID deletion logic", async () => {
                expect(deleteDID.mock.calls.length).toBe(1);
                expect(deleteDID).toHaveBeenCalledWith(contract,DID);
            });
        });

        it ("gateway calls - gateway null", async () => {
            getGateway.mockReturnValue(null);
            await request(app)
                .delete(`/did/deleteDID/${DID}`);
            expect(getGateway.mock.calls.length).toBe(1);
            expect(startGateway.mock.calls.length).toBe(1);
        });
    });
});


