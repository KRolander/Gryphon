const bs58 = require("bs58");
const crypto = require("node:crypto");

async function createDID() {
  const randomString = bs58.default.encode(Buffer.from(crypto.randomBytes(16)));
  return "did:hlf:" + randomString;
}

module.exports = {
  createDID,
};
