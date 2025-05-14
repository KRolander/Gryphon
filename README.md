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