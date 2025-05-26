import "reflect-metadata";
import fabricContractApi from "fabric-contract-api";
const { Contract, Transaction } = fabricContractApi;
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import { Context } from "fabric-contract-api";
import DIDDocument from "../types/DIDDocument.js";

export default class DID extends Contract {
    constructor() {
        super();
    }
    // DIDExists returns true when the given DID exists in world state.
    @Transaction(false)
    async DIDExists(ctx: Context, DID: string): Promise<boolean> {
        const DIDDocJSON = await ctx.stub.getState(DID); // get the DID document from the world state
        if (DIDDocJSON && DIDDocJSON.length > 0) {
            return true;
        }
        return false;
    }

    // Returns the DID Document if it exists
    @Transaction(false)
    async getDIDDoc(ctx: Context, DID: string): Promise<string>{
        const DIDDocJSON= await ctx.stub.getState(DID);
        if (!DIDDocJSON || DIDDocJSON.length === 0){
            throw new Error(`There is no document with DID ${DID}`);
        }
        return DIDDocJSON.toString();
    }

    // StoreDID transaction records a new pair of the given DID and DIDDocument to the world state
    @Transaction()
    public async storeDID(
        ctx: Context,
        DID: string,
        DIDDoc: string,
    ): Promise<void> {
        // Check if the DID is already in the ledger
        const DIDExists = await this.DIDExists(ctx, DID);

        if (DIDExists) {
            // TODO Make custom error types to use instead of the generic one
            throw new Error(`The DID document with DID ${DID} already exists`);
        }

        // TODO call to method-specific operation

        // Check if the DID Document is valid
        const doc = JSON.parse(DIDDoc);

        // Put the DID document on the ledger
        await ctx.stub.putState(
            DID,
            Buffer.from(stringify(sortKeysRecursive(doc))),
        );
    }

    @Transaction()
    public async updateDIDDoc(
        ctx: Context,
        DID: string,
        DIDDoc: string,
    ): Promise<void> {

        // The DID Document can only be updated if it was already stored
        const DIDExists = await this.DIDExists(ctx, DID);
        if (!DIDExists) {
            throw new Error(`Cannot update DID Document, the DID ${DID} doesn't exists`);
        }

        // Retrieve the current DID Document and update the fields
        const oldDoc = JSON.parse(await this.getDIDDoc(ctx, DID)) as DIDDocument;

        // TODO: prompt authentication to verify that the user is the DID controller
        // TODO: throw an error if unauthorized

        const changes = JSON.parse(DIDDoc) as Partial<DIDDocument>;
        const newDoc = { ...oldDoc, ...changes } as DIDDocument;

        // Ensure that the DID subject hasn't been changed
        if (oldDoc.id !=  newDoc.id) {
            throw new Error(`Cannot change the DID Subject of the DID ${DID}`);
        }

        // TODO: ensure that other immutable fields remained unchanged

        // Put the new DID document on the ledger
        await ctx.stub.putState(
            DID,
            Buffer.from(stringify(sortKeysRecursive(newDoc))),
        );

    }

    @Transaction()
    public async deleteDID(ctx: Context, DID: string): Promise<void> {
        // TODO: Add authentication to make sure that the user is the controller of the DID
        // Check if the DID Document exists
        const DIDExists = await this.DIDExists(ctx, DID);
        if (!DIDExists) {
            throw new Error(`Cannot delete the DID ${DID}, it doesn't exist`);
        }

        await ctx.stub.deleteState(
            DID
        );
    }
}
