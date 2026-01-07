# Digital Identity Management System Using Hyperledger Fabric

A video demonstration, showcasing the functionalities of Gryphon, can be found at [www.youtube.com/watch?v=_MIMSX_yqOI](https://www.youtube.com/watch?v=_MIMSX_yqOI)

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

1. Keycloak server, which manages authentication
2. Frontend Web application
3. Backend APIs and Gateway to Fabric network

Before running this commands, it's important to provide a `.env` file in the root directory (the same that contains the file `docker-compose.yml`) with the credentials of the Keycloak administrator in the following format:

```text
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=admin
```

With this file in the root directory, we can now run the 3 components of our application, using the following `Docker compose` command from the root directory:

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

Here, you will have to log in to the admin account. Unless specified otherwise, the username and password are the same, namely `admin`.

Now, you will see a menu on the left side of the screen. Navigate to `Manage realms`

Finally, click the blue button that says `Create realm`

When the dialogue pops up, all you need to do is enter the `realm name` which is `users`, and click on `Create`.

Now, go to Realm Settings, then User profile and delete the `firstname` and `lastname` attributes.

Next, go to `Client Scopes` and search for `roles`. Then, select `Mappers` and `client-roles`. Then, three important things:

- Client ID: admin-cli
- Add to ID token: On
- Add to userinfo: On

Go to `Clients`, select `admin-cli` and `Roles`. Add the following roles:

- admin
- master_admin

Finally, add a User with the same username and password that you defined in the `.env` file. Assign the role of `master_admin` to this user. Make sure you also add an email (and mark it as verified) for this user.

After doing this, the authentication system should run flawlessly.

## Logging Setup

To enable logging and monitoring of the application, you can run our monitoring suite, made up of:

1. [Grafana](https://grafana.com/), a composable observability platform, provides a centralized dashboard to monitor logs.
2. [Loki](https://grafana.com/oss/loki/), a highly-scalable log aggregation system from the Grafana developers, provides storage for the logs
3. [Alloy](https://grafana.com/docs/alloy/latest/), a log collector from the Grafana developers, fetches and processes local logs and sends them to Loki.

These tools can be run together by using the following `Docker compose` command from the root directory:

```bash
cd logging
docker-compose up -d
```

Now, the Grafana dashboard can be accessed by navigating to [http://localhost:3200/](http://localhost:3200) on your browser, where you can monitor and query the incoming logs.

If it's the first time you are accessing Grafana, you will need to connect it to the Loki as a data source in this way:
- Navigate to [http://localhost:3200/](http://localhost:3200)
- Log in with the default credentials "admin", "admin". Remember to change those later.
- On the left panel, click on `Connections`, then `Add new connection`, and search for `Loki`.
- Keep the default name `loki` and set `URL` to `http://loki:3100`, then scroll to the bottom and click `Save & test`, if the connection is valid you will see a success message.

Now that we have a valid Data Source connected to Grafana, we can monitor the logs through a dashboard, we provide a dashboard that can be imported in this way:
- On the left panel, click on `Dashboards`, then, in the top right corner, click on `New` and `Import`
- The provided dashboard is `/logging/dashboard/Gryphon-dashboard.json`, you drag and drop it in the `Upload dashboard JSON file` field and press `Load`
- Now you can open the dashboard by selecting it from the list in `Dashboards`
- Right after import, visualizations might not work at first, if the problem persists, navigate to the individual components of the dashboard and click on `Menu`, in the top-right corner of the component, and `Edit`.
- Then just click the button `Back to dashboard` on top, without changing anything, and the visualization should start working correctly

## RootTAO and Verifiable Credential mappings  

For the Trustchain model to work 2 things needs to be managed: the Root Trusted Authority Organization (RootTAO) and the Verifiable Credential Mappings. The RootTAO can only be set by the master admin, while the mappings can be added by both the the master admin and normal admins. 

The RootTAO is the DID of an inherently trusted authority such as the Ministry of Education. Furthermore, the rootTAO needs to issue a VC with the type root to itself.

The Verifiable Credential mappings are set in place to enforce what VC is needed to issue other VCs (for example, to issue a Diploma VC, the issuer would require a VC with the type DiplomaIssuer). To allow this, the admin needs to set the following mapping Diploma:DiplomaIssuing. 

## Public registries

A public registry is an important component of the Trustchain model. If an organization/user wants to issue a Verifiable Credential, they need to store another Verifiable Credential, that allows them to performe that action inside of their public registry. For example, if a university wants to issue a a VC of type Diploma to a student and the mapping (see section `RootTAO and Verifiable Credential mappings`) is Diploma:DiplomaIssuing, then the university needs to provide a (valid) VC with the type Diploma Issuing in their public registry.

Each organizations/user is allowed to have a public registry, for which they can specify its URL in the service field of the DID Document. The public registry needs to be modeled as a map where:
- Key: A Decentralized Identifier (DID) 
- Value: A list of VC associated with that DID (it includes only the VCs that the organization wants to disclose) 

We do not provide functionality for the public registry. The public registry needs to be managed by their respective organization. However, we do offer 2 public registries as example. The registries are found in `/backend/registries` and they can be accessed from the URL `http://localhost:3000/registry/:org`. 

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


