# Digital Identity Management System Using Hyperledger Fabric

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
These *contracts*, define how operations are executed on the channel, and they are the only way to interact with the data stored on the blockchain.

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
1. Keycloak server, which manages authentication
2. Frontend Web application
3. Backend APIs and Gateway to Fabric network

These 3 components have been Dockerized and can be run together, using the following `Docker compose` command from the root directory:
```bash
docker-compose up -d
```

If the Keycloak server was pulled and executed for the first time, follow the steps described in the [next section](#keycloak-setup), before starting to use the application.

Now you should be able to open and start using our Web app by navigating to [http://localhost:5173/](http://localhost:5173) on your browser.

### Keycloak Setup

At the point of writing this, there is no code that will dynamically create a realm or client for this application. Thus, you need to create a new realm called `users`. This is case sensitive, so MAKE SURE you write the name in all lowercase.

Now, in order to do this, you must first navigate to:

```
localhost:9090
```

Here, you will have to login to the admin account. Unless specified otherwise, the username and password are the same, namely `admin`.

Now, you will see a menu on the left side of the screen. Navigate to `Manage realms`

Finally, click the blue button that says `Create realm`

When the dialogue pops up, all you need to do is enter the `realm name` which is `users`, and click on `Create`.

Now, go to Realm Settings, then User profile and delete the `firstname` and `lastname` attributes.

After doing this, the authentication system should run flawlessly.
