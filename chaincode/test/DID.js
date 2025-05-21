"use strict";

/* eslint-disable @typescript-eslint/no-unused-expressions */

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
import sortKeysRecursive from "sort-keys-recursive";

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
            let ret = {};
            if (mockStub.states) {
                ret = mockStub.states[key];
            }
            return Promise.resolve(ret);
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

            // Turn into a stringified JSON
            diddoc = stringify(sortKeysRecursive(diddoc));

            await contract.storeDID(ctx, didkey, diddoc);
            expect(stringify(sortKeysRecursive(JSON.parse(mockStub.states[didkey]))), "getDIDDoc").to.eql(diddoc);

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
            diddoc1 = stringify(sortKeysRecursive(diddoc1));

            let diddoc2 = {
                id: didkey,
                valid: false,
            };
            diddoc2 = stringify(sortKeysRecursive(diddoc2));

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
            diddoc = stringify(sortKeysRecursive(diddoc));

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

    describe("Update a DID Document", () => {
        it("should update the DID Document associated with an existing DID", async () => {
            let contract = new DIDContract();
            should.exist(contract);

            let ctx = new Context();
            ctx.stub = mockStub;

            let didkey = "did:hlf:123";
            let diddoc1 = {
                id: didkey,
                valid: true,
            };
            diddoc1 = stringify(sortKeysRecursive(diddoc1));

            let diddoc2 = {
                id: didkey,
                valid: false,
            };
            diddoc2 = stringify(sortKeysRecursive(diddoc2));

            await contract.storeDID(ctx, didkey, diddoc1);
            await contract.updateDIDDoc(ctx, didkey, diddoc2);

            expect(stringify(sortKeysRecursive(JSON.parse(mockStub.states[didkey].toString()))), "getDIDDoc").to.eql(diddoc2);
        });

        it("should throw an error when trying to update DID subject", async () => {
            let contract = new DIDContract();
            should.exist(contract);

            let ctx = new Context();
            ctx.stub = mockStub;

            let didkey1 = "did:hlf:123";
            let diddoc1 = {
                id: didkey1,
                valid: true,
            };
            diddoc1 = stringify(sortKeysRecursive(diddoc1));

            let didkey2 = "did:hlf:invalid";
            let diddoc2 = {
                id: didkey2,
                valid: false,
            };
            diddoc2 = stringify(sortKeysRecursive(diddoc2));

            await contract.storeDID(ctx, didkey1, diddoc1);

            return contract.updateDIDDoc(ctx, didkey1, diddoc2)
                .should.eventually.be.rejectedWith("Cannot change the DID Subject of the DID did:hlf:123");
        });

        it("should throw an error when updating a non-existing DID", async () => {
            let contract = new DIDContract();
            should.exist(contract);

            let ctx = new Context();
            ctx.stub = mockStub;

            let didkey = "did:hlf:123";
            let diddoc = {
                id: didkey,
                valid: true,
            };
            diddoc = stringify(sortKeysRecursive(diddoc));

            return contract.updateDIDDoc(ctx, didkey, diddoc)
                .should.eventually.be.rejectedWith("Cannot update DID Document, the DID did:hlf:123 doesn't exists");
        });
    });
});
