import { Context, Contract, Transaction } from "fabric-contract-api";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import { DIDDocument } from "../types/DIDDocument";

export class DID extends Contract {
    // Utility function that checks if a DID already exists on the ledger
    @Transaction(false)
    async DIDExists(ctx: Context, DID: string): Promise<boolean> {
        const DIDDocJSON = await ctx.stub.getState(DID); // get the DID document from the ledger
        return DIDDocJSON && DIDDocJSON.length > 0;
    }

    // StoreDID transaction
    // This function will be called when we want to store a new DID document
    @Transaction()
    public async storeDID(
        ctx: Context,
        DID: string,
        DIDDocument: DIDDocument,
    ): Promise<void> {
        // Check if the DID already exists
        const DIDExists = await this.DIDExists(ctx, DID);

        if (DIDExists) {
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
