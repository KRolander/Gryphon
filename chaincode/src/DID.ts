import fabricContractApi from "fabric-contract-api";
const { Contract, Transaction } = fabricContractApi;
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import type { Context } from "fabric-contract-api";
import DIDDocument from "../types/DIDDocument.js";

export default class DID extends Contract {
    constructor() {
        super();
    }
    // DIDExists returns true when the given DID exists in world state.
    @Transaction(false)
    async DIDExists(ctx: Context, DID: string): Promise<boolean> {
        const DIDDocJSON = await ctx.stub.getState(DID); // get the DID document from the world state
        return DIDDocJSON && DIDDocJSON.length > 0;
    }

    // StoreDID transaction records a new pair of the given DID and DIDDocument to the world state
    @Transaction()
    public async storeDID(
        ctx: Context,
        DID: string,
        DIDDocument: DIDDocument,
    ): Promise<void> {
        // Check if the DID is already in the ledger
        const DIDExists = await this.DIDExists(ctx, DID);

        if (DIDExists) {
            // TODO Make custom error types to use instead of the generic one
            throw new Error(`The DID document with DID ${DID} already exists`);
        }

        // TODO call to method-specific operation

        // Put the DID document on the ledger
        await ctx.stub.putState(
            DID,
            Buffer.from(stringify(sortKeysRecursive(DIDDocument))),
        );
    }
}
