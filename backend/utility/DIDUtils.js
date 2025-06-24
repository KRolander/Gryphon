const bs58 = require("bs58");
const crypto = require("node:crypto");

/**
 * @summary Creates a new DID
 * @description The created DID starts with "did:hlf:" then it appends to this a randomly generated 16 bytes long
 * string that is base58-encoded
 * @returns {Promise<string>} A string representing a DID starting with "did:hlf:"
 */
async function createDID() {
  const randomString = bs58.default.encode(Buffer.from(crypto.randomBytes(16)));
  return "did:hlf:" + randomString;
}

module.exports = {
  createDID,
};
