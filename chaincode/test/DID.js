"use strict";

import * as chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised"

const { expect } = chai;
const should = chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

import { Context } from "fabric-contract-api";
import { ChaincodeStub  } from "fabric-shim";
import DIDContract from "../build/src/DID.js";
// import DIDDocument from "../types/DIDDocument.js";
import { beforeEach, afterEach, describe, it } from "node:test";
import stringify from "json-stringify-deterministic";

describe("test DID chaincode", () => {

    let sandbox = sinon.createSandbox();
    let mockStub;

    beforeEach(() => {
        mockStub = sandbox.createStubInstance(ChaincodeStub);

        // Mock the method putState, by storing the pair (key, value) on a stubbed data structure
        mockStub.putState.callsFake((key, value) => {
            if (!mockStub.states) {
                mockStub.states = {};
            }
            mockStub.states[key] = value;
        });

        // Mock the method getState, by querying the stubbed dictionary
        mockStub.getState.callsFake(async (key) => {
            let ret;
            if (mockStub.states) {
                ret = mockStub.states[key];
            }
            return Promise.resolve(ret)
        })
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Store a DID", () => {

        it("should register the DID and DID document to the ledger", async () => {
            let contract = new DIDContract();
            should.exist(contract);

            let ctx = new Context();
            ctx.stub = mockStub;

            let didkey = "did:hlf:123";
            let diddoc = {
                id: didkey,
                valid: true,
            };

            await contract.storeDID(ctx, didkey, diddoc);
            expect(mockStub.states[didkey].toString(), "getDIDDoc").to.eql(stringify(diddoc));

        })

        it("should throw an error if the DID is already in the ledger", async () => {
            let contract = new DIDContract();
            should.exist(contract);

            let ctx = new Context();
            ctx.stub = mockStub;

            let didkey = "did:hlf:123";
            let diddoc1 = {
                id: didkey,
                valid: true,
            };
            let diddoc2 = {
                id: didkey,
                valid: false,
            };

            await contract.storeDID(ctx, didkey, diddoc1);
            return contract.storeDID(ctx, didkey, diddoc2)
              .should.eventually.be.rejectedWith("The DID document with DID did:hlf:123 already exists");
        });
    });

    describe("Check if a DID exists", () => {

        it("should return true if the DID was stored in the ledger", async () => {
            let contract = new DIDContract();
            should.exist(contract);

            let ctx = new Context();
            ctx.stub = mockStub;

            let didkey = "did:hlf:123";
            let diddoc = {
                id: didkey,
                valid: true,
            };

            await contract.storeDID(ctx, didkey, diddoc);

            let ret = await contract.DIDExists(ctx, didkey);
            expect(ret).to.be.true;
        });

        it("should return false if the DID is not in the ledger", async () => {
            let contract = new DIDContract();
            should.exist(contract);

            let ctx = new Context();
            ctx.stub = mockStub;

            let didkey = "definitely:not:in:ledger";

            let ret = await contract.DIDExists(ctx, didkey);
            expect(ret).to.be.false;
        });
    });
});
