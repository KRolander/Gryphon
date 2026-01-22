import "reflect-metadata";
import fabricContractApi from "fabric-contract-api";
const { Contract, Transaction } = fabricContractApi;
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import { Context } from "fabric-contract-api";
import type { DIDDocument } from "../types/DIDDocumentBuilder.js";
import * as crypto from "crypto";

export default class DID extends Contract {
    constructor() {
        super();
    }
    /**
     * @summary The method used for verifying if a certain DID and an assoiciated data exist on the ledger
     *
     * @param {Context} ctx The transaction context used for interacting with smart contracts
     * @param {string} DID The DID to be searched on the ledger
     *
     * @returns {Promise<boolean>} True if the DID and its associated data are on the ledger, false otherwise
     */
    @Transaction(false)
    async DIDExists(ctx: Context, DID: string): Promise<boolean> {
        // Check for extra "" in the DID
        const cleanDID = DID.replace(/^"|"$/g, "");
        const DIDDataJSON = await ctx.stub.getState(cleanDID); // get the DID document from the world state
        if (DIDDataJSON && DIDDataJSON.length > 0) {
            return true;
        }
        return false;
    }

    /**
     * @summary The method used to get the DID document from the ledger, given a DID
     *
     * @param {Context} ctx The transaction context used for interacting with smart contracts
     * @param {string} DID The DID for which the document is searched on the ledger
     *
     * @throws {Error} If the document for the given DID is not on the ledger
     * @returns {Promise<string>} The string representation of the DID document
     */
    @Transaction(false)
    async getDIDDoc(ctx: Context, DID: string): Promise<string> {
        // Check for extra "" in the DID
        const cleanDID = DID.replace(/^"|"$/g, "");
        const DIDDocJSON = await ctx.stub.getState(cleanDID);
        if (!DIDDocJSON || DIDDocJSON.length === 0) {
            throw new Error(`There is no document with DID ${DID}`);
        }
        return DIDDocJSON.toString();
    }

    /**
     * @summary The method used to get the DID data structure from the ledger, corresponding to a given DID
     *
     * @param {Context} ctx The transaction context used for interacting with smart contracts
     * @param {string} DID The DID for which the DID data structure is searched on the ledger
     *
     * @throws {Error} If the DID Data structure for the given DID is not on the ledger
     * @returns {Promise<string>} The string representation of the DID Data structure
     */
    @Transaction(false)
    async getDIDDataStructure(ctx: Context, DID: string): Promise<string> {
        // Check for extra "" in the DID
        const cleanDID = DID.replace(/^"|"$/g, "");
        const DID_DataStructJSON = await ctx.stub.getState(cleanDID);
        if (!DID_DataStructJSON || DID_DataStructJSON.length === 0) {
            throw new Error(`There is no document with DID ${DID}`);
        }
        return DID_DataStructJSON.toString();
    }


    // StoreDID transaction records a new pair of the given DID and DIDDocument to the world state
    /**
     * @summary The method used to store a DID and its DID document on the ledger
     * @description The method checks if the DID is already on the ledger and if not, it stores the provided DID and
     * the provided DID document
     *
     * @param {Context} ctx The transaction context used for interacting with smart contracts
     * @param {string} DID The DID to be stored on the ledger
     * @param {string} DIDDoc The DID document to be stored on the ledger
     *
     * @throws {Error} If the DID and its document are not on the ledger
     */
    @Transaction()
    public async storeDID(
        ctx: Context,
        DID: string,
        DIDDoc: string,
    ): Promise<void> {

        // Check if the DID is already in the ledger
        const DIDExists = await this.DIDExists(ctx, DID);
        // Check for extra "" in the DID
        const cleanDID = DID.replace(/^"|"$/g, "");

        if (DIDExists) {
            // TODO Make custom error types to use instead of the generic one
            throw new Error(`The DID document with DID ${DID} already exists`);
        }

        // Check if the DID Document is valid
        const doc = JSON.parse(DIDDoc);

        // Put the DID document on the ledger
        await ctx.stub.putState(
            cleanDID,
            Buffer.from(stringify(sortKeysRecursive(doc))),
        );
    }

    // storeDIDdataStruct transaction records a new pair of the given DID and DID data structure to the world state
    /**
     * @summary The method used to store a DID and its DID data structure on the ledger
     * @description The method checks if the DID is already on the ledger and if not, it stores the provided DID and
     * the provided DID data structure. {DID : DID_dataStruct}
     *
     * @param {Context} ctx The transaction context used for interacting with smart contracts
     * @param {string} DID The DID to be stored on the ledger
     * @param {string} DID_dataStruct The DID Data structure containig many DID related inforamtion. Note: this data is serialized into string before its storage.
     *
     * @throws {Error} If the DID and its document are not on the ledger
     */
    @Transaction()
    public async storeDIDdataStruct(
        ctx: Context,
        DID: string,
        DID_dataStruct: string, // marshalled into string
    ): Promise<void> {
        const hash = "sha256";

        // Check if the DID is already in the ledger
        const DIDExists = await this.DIDExists(ctx, DID);
        // Check for extra "" in the DID
        const cleanDID = DID.replace(/^"|"$/g, "");

        if (DIDExists) {
            // TODO Make custom error types to use instead of the generic one
            throw new Error(`The DID_dataStruct with DID ${DID} already exists`);
        }

        // Convert json-string to the object
        const recovered_DID_dataStruct = JSON.parse(DID_dataStruct);
        const publicKey = recovered_DID_dataStruct.DID_PubKey;
        const signature = recovered_DID_dataStruct.Metadata.Signature;

        const verify = crypto.createVerify(hash);
        const msg = recovered_DID_dataStruct.Metadata.Action + recovered_DID_dataStruct.Metadata.DIDCreationTimestamp;
        verify.write(msg);
        verify.end();

        if (!verify.verify(publicKey, signature, "hex")){
            throw new Error("The DID_dataStruct's signature is not valid");
        }
            // Put the DID document on the ledger
            await ctx.stub.putState(
                cleanDID,
                Buffer.from(DID_dataStruct),
            );
    }

    /**
     * @summary The method used for updating a DID document
     * @description The method checks if the DID is on the ledger. If successful, it creates a DID document with
     * optional fields and makes a new document by replacing changes in the fields with the ones that are different in
     * the provided DID document
     *
     * @param {Context} ctx The transaction context used for interacting with smart contracts
     * @param {string} DID The DID used to get the document from the ledger
     * @param {string} DIDDoc The DID document to be stored on the ledger
     *
     * @throws {Error} If the DID and its document are not on the ledger
     * @throws {Error} If the fixed fields have changed (for now only the id)
     * @returns {Promise<Buffer>} The success state if the document has been correctly updated
     */
    @Transaction()
    public async updateDIDDoc(
        ctx: Context,
        DID: string,
        DIDDoc: string,
    ): Promise<Buffer> {

        // Check for extra "" in the DID
        const cleanDID = DID.replace(/^"|"$/g, "");
        // The DID Document can only be updated if it was already stored
        const DIDExists = await this.DIDExists(ctx, cleanDID);

        if (!DIDExists) {
            throw new Error(`Cannot update DID Document, the DID ${cleanDID} doesn't exists`);
        }

        // Retrieve the current DID Document and update the fields
        const oldDoc = JSON.parse(await this.getDIDDoc(ctx, cleanDID)) as DIDDocument;

        // TODO: throw an error if unauthorized

        const changes = JSON.parse(DIDDoc) as Partial<DIDDocument>;
        const newDoc = { ...oldDoc, ...changes } as DIDDocument;

        // Ensure that the DID subject hasn't been changed
        if (oldDoc.id != newDoc.id) {
            throw new Error(`Cannot change the DID Subject of the DID ${cleanDID}`);
        }

        // TODO: ensure that other immutable fields remained unchanged

        // Put the new DID document on the ledger
        await ctx.stub.putState(
            cleanDID,
            Buffer.from(stringify(sortKeysRecursive(newDoc))),
        );
        return Buffer.from(JSON.stringify({ success: true }));
    }


     /**
     * @summary The method used for updating a DID data structure
     * actually when the issuer aims to modify the DID Document it first checks
     * if the DID already exists in the ledger.
     * @description The method checks if the DID is on the ledger and verifies by the cryptographic signature 
     * verification if the DID Issuer has right to modify the DID, meaning it signed the 
     * Updata Action and the Update Timestemp with the private key corresponding to the given DID 
     * @param {Context} ctx The transaction context used for interacting with smart contracts
     * @param {string} DID The DID used to get the document from the ledger
     * @param {string} DID_dataStruct The DID document to be stored on the ledger
     *
     * @throws {Error} If the DID and its document are not on the ledger
     * @throws {Error} If the fixed fields have changed (for now only the id)
     * @returns {Promise<\\>} The success state if the document has been correctly updated
     */
     @Transaction()
     public async updateDID(
         ctx: Context,
         DID: string,
         DID_dataStruct: string,
     ): Promise<string> {
 
         // Check for extra "" in the DID
         const cleanDID = DID.replace(/^"|"$/g, "");
         // The DID Document can only be updated if it was already stored
         const DIDExists = await this.DIDExists(ctx, cleanDID);
 
         if (!DIDExists) {
            throw new Error(`Cannot update DID Document, the DID ${cleanDID} doesn't exists`);
         }

         const Updated_DIDData = JSON.parse(DID_dataStruct);

         // Verify signature           
         // Convert json-string to the object
        const hash = "sha256";

        const publicKey = Updated_DIDData.DID_PubKey;
        const signature = Updated_DIDData.Metadata.Signature;
        const verify = crypto.createVerify(hash);

        const msg = Updated_DIDData.Metadata.Action + Updated_DIDData.Metadata.DIDUpdateTimestamp;
        verify.write(msg);
        verify.end();

        if (!verify.verify(publicKey, signature, "hex")){
            throw new Error("The DID_dataStruct's signature is not valid");
        }

         // Retrieve the current DID Data Structure and update the fields
         const old_DIDData = JSON.parse(await this.getDIDDataStructure(ctx, cleanDID));
 
        const new_metadata = {
            DIDCreationTimestamp: old_DIDData.Metadata.DIDCreationTimestamp,
            DIDUpdateTimestamp: Updated_DIDData.Metadata.DIDUpdateTimestamp,
            Action: old_DIDData.Metadata.Action,
            Signature: Updated_DIDData.Metadata.Signature
        };
    
        const new_DIDData = {
            DID: old_DIDData.DID,
            DID_PubKey: old_DIDData.DID_PubKey,
            Controller: old_DIDData.Controller,
            DC_flag_version: old_DIDData.DC_flag_version,
            Metadata: new_metadata
        };         

        if(old_DIDData.Controller !== Updated_DIDData.Controller) {
            new_DIDData.Controller = Updated_DIDData.Controller
        }

        if(old_DIDData.DC_flag_version !== Updated_DIDData.DC_flag_version) {
            new_DIDData.DC_flag_version = Updated_DIDData.DC_flag_version
        }
 
         // Put the updated DID Data Strucure on the ledger
         await ctx.stub.putState(
             cleanDID,
             Buffer.from(stringify(sortKeysRecursive(new_DIDData))),
         );
         return JSON.stringify(new_DIDData)
     }

    /**
     * @summary The method used to delete a DID from the ledger
     * @description The method checks if the DID is already on the ledger and deletes it if it is found
     *
     * @param {Context} ctx The transaction context used for interacting with smart contracts
     * @param {string} DID The DID to be deleted
     *
     * @throws {Error} If the DID and its document are not on the ledger
     */
    @Transaction()
    public async deleteDID(ctx: Context, DID: string): Promise<void> {
        // TODO: Add authentication to make sure that the user is the controller of the DID
        // Check if the DID Document exists on the ledger
        const DIDExists = await this.DIDExists(ctx, DID);
        // Check for extra "" in the DID
        const cleanDID = DID.replace(/^"|"$/g, "");
        if (!DIDExists) {
            throw new Error(`Cannot delete the DID ${cleanDID}, it doesn't exist`);
        }

        await ctx.stub.deleteState(
            cleanDID
        );
    }
}
