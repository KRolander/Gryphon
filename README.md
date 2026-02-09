# Digital Identity Management System Using Hyperledger Fabric

This implementation is based on [**Gryphon**](git@github.com:Iron-Trust/Gryphon.git) Digital Identity Management System. This system is used to store the DID related data which allows a decentralized traecability of the versions of DID documents issued by the DID issuer. Moreover, the implementation increases the trust in the update process of the DID documents through the distributed signature verification (issued by the smart contracts aka chaincodes). 
* When the DID document has to be updated the self-sovereign wallet containing the private key associated with the DID signs the timestamp and the signature is verified by the smart contract of the DLT (Hyperledger Fabric). When the signature is not valid the DID document update is aborted. This method reinforces that only the keyholder (private key associated with the DID) is able to approve the update or the creation of the given DID. Note that in this implementation there are three main API endpoints which can be accessed by the DID Issuer and DID Resolver Applications. The self-sovereign wallet seamlessly interacts with the DID Issuer and DID Resolver Applications while the DID Resolver/Issuer applications interact with the Gryphon platform which contains a backend implementation containing API endpoints and a gateway interface to enable the communication with the DLT - Hyperledger Fabric network.
It should be noted, that metadata (DID Data Structure) is also stored on the distributed ledger state allowing a distributed traceabiliy of the DID related data such as the version and timestamp of DID modification and DID creation and a distributed verification of the signatures related to DID operations - *DID issuance and resolving* -. 

**Note**: This implementation of Gryphon has been modified to respond to [**Recitals EU Horizon project's**](https://recitals-project.eu/index.html) requirements.


Basic data flow between the different modules:
```bash
Self-sovereign Wallet <----> DID Issuer/Resolver <----> DLT (Hyperledger Fabric) 
                                      |
                                      |
                                      <-----> Public Registry (DID Dociment storage)
```                            

Note: the Self-sovereign wallet and Public Registry does not take part of this implementation.

## DID Data structure
* `DID` : DID string (e.g., "did:hlf:3ia3YvihEk9FD9iMvWodqm")
* `DID_PubKey` : Public key assigned to the issue DID - crypto spec: ECDSA - secp256k1 curve. The private key pair of this key is used to sign the `DIDCreationTimestamp / DIDUpdateTimestamp` concatenated with the `Action` (e.g., "-----BEGIN PUBLIC KEY-----\nMFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEb3BU7usOJYeED+u72Dp5e3 T2eS5UggF\n9wfomjtmzDfyhdATvM5fUhlwc7KzrDQaQEjZOt6XqyErDOJTZ4AHig==\n-----END PUBLIC KEY-----\n")
* `Controller` : The controller of the DID, in general it is the same as the DID, but it can also be the DID of another entity (e.g., government's DID, ministry of education's DID).
* `DC_flag_version` : Deactivation Flag Version
* `Metadata` :
### Metadata
* `DIDCreationTimestamp` : creation time stamp (e.g., "2026-01-08T15:12:43.394Z")
* `DIDUpdateTimestamp` : when the DID Document has to be updated, this timestamp is added, so users can know the data of modification.
* `Action` : *CreateDID* when the DID is created and *UpdateDID* when the DID Document is updated, therefore the DID data structure also has to be modified
* `Signature` : Signature issued by the private key associated with the DID - signature done on the hash of `DIDCreationTimestamp / DIDUpdateTimestamp` concatenated with the `Action`. Crypo spec: ECDSA - secp256k1 curve, Hash SHA-256

# Examples
[Core tests](./recitals_core_tests/core_tests.js): contains the core functionality tests allowing to create, get, and update DID data.

[Create and Get Test](./recitals_core_tests/example_store_DID.js): creates a DID and DID data structure that will be stored on the DLT and the example verifies if the DID data structure has been successfully stored.

[Update DID](./recitals_core_tests/example_update_DID.js): Updates and existing DID data structure. Note: a valid DID string has to be provided which has already been used for storing the DID data structure on the DLT. 

[Create DID via curl](./recitals_core_tests/curl_reateDID.bash): DID data will be sent via curl and [data_createDID.json](./recitals_core_tests/data_createDID.json) containing the DID data will be stored on the DLT.

# Unit/Integration tests
The implemention comes with unit/integration tests for the main functionalities: DID - Create/Update/Get

* [**Unit Tests**](./recitals_core_tests/did_unit_tests.js)

These tests are used to highlight how the API end points can be accessed from other modules and demonstrates the different API responses, that the calling module (DID Issuer/Resolver) can expect. 

**Note**: the implementation has to be set up before running the Unit Tests.

# API endpoints
**DataFlow** Client (DID Issuer/Resolver) → REST API (backend) → Fabric Gateway → Chaincode → Ledger

| Method   | URL                                      | Description                              | Responses                               |
| -------- | ---------------------------------------- | ---------------------------------------- |---------------------------------------- |
| `POST`   | `/did/createDIDDataStruct`                   | Create a new DID data structure. The backend verifies if the required DID data structure field exist. If yes, the backend calls the dedicated chaincode, which verifies if the `Action` is `createDID` and it verifies the `Signature` with the associated `DID_PubKey` public key. If the signature is valid, the DID data structure is stored on the DLT.    | **`200`**: Storage of the DID data structure was successful<br> **`400`** : Empty field detected in the DID data structure. <br> **`500`**: Error: DID already exists / Error occurred when storing the DID on the blockchain  <br> **`501`** The signature was not valid or the DID data structure was manipulated.| 
| `GET`    | `/did/getDID/:did`                             | Retrieves the DID data structure related to `:did`.                  | **`200`** Returns the DID data structure. <br> **`500`**: The DID was not yet stored on the DLT or other DLT related error occurred. |
|  `POST`    |  `/did/updateDIDDataStruct`             | The client has to provide a DID data structure based on the original or previously modified. The `DIDUpdateTimestamp` \ `Controller` \ `DC_flag_version` might be different. The `Action` - *UpdateDID*. The backed verifies if there is no missing field in the DID data structure. The DLT chaincode updates the previously stored DID data structure.  | **`200`** Returns the DID data structure. <br> **`400`** : Empty field detected in the DID data structure. <br>  **`500`**: Error occurred when storing the DID on the blockchain. <br> **`501`** The signature was not valid or the DID data structure was manipulated.                       |

# Implementation Setup
These setups are necessary to run the examples and tests.


## Fabric setup

To install the necessary prerequisites, go to [Prerequisites](https://hyperledger-fabric.readthedocs.io/en/release-2.5/prereqs.html)

### Running the example network

To get the Fabric network running, ensure that Docker (or Docker desktop) is running and NOT in "Resource saver mode".
Then simply run this command from the root directory:

```bash
./scripts/setup.sh
```

This script will execute the following operations, in this order:

1. Install the required Fabric binaries and docker images, necessary to run the network.
2. Stop any previous Fabric network currently running, then start the network.
3. Create a channel `didchannel`, and join with the peers. For a more in-depth explanation about what this and the next step entails, check out the [official documentation](https://hyperledger-fabric.readthedocs.io/en/release-2.5/create_channel/create_channel_test_net.html).
4. Create a channel `vcchannel`, and join with the peers.
5. Deploy the chaincode from the directory `chaincodeDID`, on the peers of channel `didchannel`. More details about this step can be found in the [following section](#chaincode-deployment)
6. Deploy the chaincode from the directory `chaincodeVC`, on the peers of channel `vcchannel`.

If the setup was successful, you will read on your terminal: `The chaincode has been successfully installed on the peers.`

### Chaincode deployment

To execute transactions on the blockchain, the peers of the network need to have chaincode, or smart contracts, installed.
These _contracts_, define how operations are executed on the channel, and they are the only way to interact with the data stored on the blockchain.

These are the operations carried out, to deploy the chaincode on the peers, by the previously mentioned script `setup.sh`:

1. Install the dependencies on the chaincode directory (with `npm install`)
2. Compile Typescript code into Javascript (with `npm run build`)
3. Package the chaincode
4. Install on all peers
5. Seek approval from peers
6. Check if the amount of approvals satisfies the policy of the channel
7. Commit chaincode to the channel

During Step 4, a Docker container is dynamically created and ran in the network for each peer that installed the chaincode.
These containers, named `dev-peer...` are the actual Fabric agents, responsible for executing the chaincode installed on them, whenever their corresponding peer receives a request from the backend.

In our case, if the execution was successful, there should be 4 `dev-peer` Docker containers running, 2 with the `chaincodeDID` installed and 2 with the `chaincodeVC`.

## Application Setup

If the Fabric network setup was successful and, the network is running, we can now run the main components of our application:

1. Frontend Web application
2. Backend APIs and Gateway to Fabric network


With this file in the root directory, we can now run the 2 components of our application, using the following `Docker compose` command from the root directory:

```bash
docker-compose up -d --build
```

**Backend Listens: http://localhost:3000**
**Frontend Listens: http://localhost:5173**




# Known issues when installing
When using Ubuntu 20.04 - the latest version of binaries will not be compatible 

Error message:
```bash 
Peer binary and configuration files not found..

Follow the instructions in the Fabric docs to install the Fabric Binaries:
https://hyperledger-fabric.readthedocs.io/en/latest/install.html
```
To test go to `network/example/fabrci-samples/bin` run:

```bash 
./peer version
```
If the error message is:

```bash 
peer: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.34' not found (required by peer)
peer: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.32' not found (required by peer)
```

It is because from version 2.5.11 - dockerhub utilize Ubuntu 22.04.

Under **Ubuntu 20.04** please replace in [setup,sh](./scripts/setup.sh) 

```bash
  ./install-fabric.sh --fabric-version 2.5.14 docker binary
```
to 

```bash
  ./install-fabric.sh --fabric-version 2.5.14 docker
  ./install-fabric.sh --fabric-version 2.5.10 binary
```

