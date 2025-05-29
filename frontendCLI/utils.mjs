import * as crypto from 'node:crypto';
import base58Generator from 'bs58';

export function generateKeys(password){
    const {publicKey, privateKey} = crypto.generateKeyPairSync('ec',{
        namedCurve: 'P-256',
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem' //maybe we will need jwt - returns object, with PEM - string
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',//to encrypt the private key this is the standard if wew do not want to make cutom ecryption + salting
            passphrase: password //should ask the user to generate strong password or make the system generate one so that user can save it
            //good to be another password as if the account is hacked did is still safe
        }
    })
    return {publicKey,privateKey};
}

export function createDID(){
    const randomString = base58Generator.encode(crypto.randomBytes(16));
    return 'did:hlf:'+randomString;
}
