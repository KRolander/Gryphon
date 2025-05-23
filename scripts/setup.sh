#!/usr/bin/env bash
#TO RUN THE FILE FROM 15b RUN: bash scripts/setup.sh - !!do not forget to open docker desktop
source "$(dirname "$0")/utils.sh"

# 1 - Network setup, shut down preexisting networks and get a new network running with a channel
# Should be called from the root directory 15b
function networkSetup() {
  cd "network/example" || exit 

  ./install-fabric.sh

  # Access the directory that contains the network.sh script
  cd "fabric-samples/test-network" || exit

  # Shut down the network - start from clean slate
  ./network.sh down

  # Start the test-network --> 2 organizations and one channel
  # And create a channel between the peers named mychannel
  ./network.sh up createChannel -c mychannel

  # If any problem is encountered, exit
  if [ $? -ne 0 ]; then
      fatalln "The network couldn't be started."
  fi

  # Move back to 15b
  cd ../../../../
  successln "The network is running successfully and the channel has been created."
}

# 2 - Deploy the chaincode to all the peers in the channel
# Should be called from the root directory 15b
function deployCC() {
  # Access the directory that contains the network.sh script
  cd "network/example/fabric-samples/test-network" || exit

  # Deploy the chaincode (the given script does most of the heavy lifting here)
  # It also runs 'npm install' and 'npm run build' on the chaincode directory before starting
  ./network.sh deployCC -c mychannel -ccn tscc -ccp ../../../../chaincode/ -ccl typescript

  # If any problem is encountered, exit
  if [ $? -ne 0 ]; then
      fatalln "The chaincode couldn't be deployed."
  fi

  # Move back to 15b
  cd ../../../../
  successln "The chaincode has been successfully installed on the peers."
}

# Get the location of the script
ROOTDIR=$(cd "$(dirname "$0")" && pwd)

# push to the required directory & set a trap to go back if needed
pushd ${ROOTDIR} > /dev/null
trap "popd > /dev/null" EXIT

# Move to the location of the script and then one directory up to start
# This ensures that we end up in 15b, it doesn't matter where the script was called from
cd "$ROOTDIR" || exit
cd ../

# 1 - Network setup
networkSetup

# 2 - Deploy chaincode
deployCC

# #5 - Starting the CLI and installing needed modules
# cd frontendCLI || exit
# if [ ! -d "node_modules/bs58" ]; then
#  npm install bs58 #needed to generate the method identifier for DIDs
# fi
# cd ../ #to remain in root
# echo "Starting CLI..."
# node frontendCLI/main.mjs #!!!needs node version above 17 to work - install nvm to update
# # node then run
# # export NVM_DIR="$HOME/.nvm"
#                 #[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# #and
#                 #source ~/.bashrc
