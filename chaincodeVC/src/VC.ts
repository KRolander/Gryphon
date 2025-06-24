import fabricContractApi, { Context } from "fabric-contract-api";
const { Contract, Transaction } = fabricContractApi;

export default class VC extends Contract{
    constructor() {
        super();
    }

    /**
     * @summary The method used for verifying if a certain VC type mapping exists on the ledger
     *
     * @param {Context} ctx The transaction context used for interacting with smart contracts
     * @param {string} mapKey The mapping Key to search if it is on the ledger
     *
     * @returns {Promise<boolean>} True if the mapping is on ledger, false otherwise
     */
    @Transaction(false)
    async mapExists(ctx: Context, mapKey: string): Promise<boolean> {

        const mapValue = await ctx.stub.getState(mapKey);

        if (mapValue && mapValue.length > 0) {
            return true;
        }
        return false;
    }

    /**
     * @summary The method used to get the value of a VC type from the mapping on the ledger
     *
     * @param {Context} ctx The transaction context used for interacting with smart contracts
     * @param {string} mapKey The key in the mapping to retrieve the value for
     *
     * @throws {Error} If the mapping is not on the ledger
     * @returns {string} The value from the mapping of VC types
     */
    @Transaction(false)
    async getMapValue(ctx: Context, mapKey: string){
        const mapValue= await ctx.stub.getState(mapKey);
        if (!mapValue || mapValue.length === 0){
            throw new Error(`There is no mapping for this type of VC ${mapKey}`);
        }
        return mapValue.toString();
    }

    /**
     * @summary The method used to store VC type mappings on the ledger in the form of key:value
     *
     * @param {Context} ctx The transaction context used for interacting with smart contracts
     * @param {string} mapKey The key in the mapping to be stored, representing a VC type
     * @param {string} mapValue The value in the mapping to be stored, representing a VC type
     *
     * @throws {Error} If the mapping key is already paired with another value on the ledger
     * @returns {Promise<Buffer>} A buffer from a stringified JSON object containing a successful message
     */
    @Transaction()
    public async storeMapping(
        ctx: Context,
        mapKey: string,
        mapValue: string,
    ): Promise<Buffer> {
        const mappingExists = await this.mapExists(ctx, mapKey);

        if (mappingExists) {
            throw new Error(`The mapping for VC type ${mapKey} already exists`);
        }

        await ctx.stub.putState(
            mapKey,
            Buffer.from(mapValue),
        );

        return Buffer.from(JSON.stringify(`The mapping with key ${mapKey} and value ${mapValue} stored successfully`));
    }

}
