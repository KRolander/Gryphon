export default class DIDDocument {
    constructor(data) {
        if (!data || !data.id) {
            throw new Error("DIDDocument must have a non-empty 'id'");
        }
        this.id = data.id;
        if (data["@context"] !== undefined)
            this["@context"] = data["@context"];
        if (data.valid !== undefined)
            this.valid = data.valid;
    }
}
