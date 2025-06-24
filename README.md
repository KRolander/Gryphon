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
