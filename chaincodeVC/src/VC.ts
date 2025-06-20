import fabricContractApi, { Context } from "fabric-contract-api";
const { Contract, Transaction } = fabricContractApi;

export default class VC extends Contract{
    constructor() {
        super();
    }

    @Transaction(false)
    async mapExists(ctx: Context, mapKey: string): Promise<boolean> {

        const mapValue = await ctx.stub.getState(mapKey); // get the DID document from the world state

        if (mapValue && mapValue.length > 0) {
            return true;
        }
        return false;
    }

    @Transaction(false)
    async getMapValue(ctx: Context, mapKey: string){
        const mapValue= await ctx.stub.getState(mapKey);
        if (!mapValue || mapValue.length === 0){
            throw new Error(`There is no mapping for this type of VC ${mapKey}`);
        }
        return mapValue.toString();
    }

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
