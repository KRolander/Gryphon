# Identity Management System Using Hyperledger Fabric

## Fabric setup
To install the necessary prerequisites, go to [Prerequisites](https://hyperledger-fabric.readthedocs.io/en/release-2.5/prereqs.html)

### Running the example network
First you need to install the binaries necessary for running the network.
To install the binaries, run:

```bash
cd network/example
./install-fabric.sh --fabric-version 2.5.13 binary
```
After installing the binaries, to start the network, run

```bash
cd fabric-samples/test-network
./network.sh up
```

## Chaincode setup
To deploy chaincode (smart contracts), we need to have Channels in our network, so that we can deploy it on all the peers of a given channel.

To create and join a channel after the network is created, run the following command

```bash
./network.sh createChannel -c mychannel
```

Otherwise, you can shut down your current network with

```bash
./network.sh down
```

And bring up a new fabric network with one channel with the command
```bash
./network.sh up createChannel -c mychannel
```

If the channel creation was successful, you will read `Channel 'mychannel' joined` in your terminal.

Now we can deploy the chaincode to the peers of the channel `mychannel` with the command

```bash
./network.sh deployCC -c mychannel -ccn tscc -ccp ../../../../chaincode/ -ccl typescript
```

This script will execute the following operations, in this order:

1. Install the dependencies on the chaincode directory (with `npm install`)
2. Compile Typescript code into Javascript (with `npm run build`)
3. Package the chaincode
4. Install on all peers
5. Seek approval from peers
6. Check if the amount of approvals satisfies the policy of the channel
7. Commit chaincode to the channel
8. Check if the commit was successful