const app = require("./app");
const { startGateway, getNetwork } = require("./gateway");

const { envOrDefault } = require("./utility/gatewayUtilities");

const DIDchannelName = envOrDefault("CHANNEL_NAME", "didchannel"); //the name of the channel from the fabric-network
const VCchannelName = envOrDefault("CHANNEL_NAME", "vcchannel");

const port = 3000;

(async () => {
  try {
    await startGateway();
    const DIDNetwork = await getNetwork(DIDchannelName);
    const VCNetwork = await getNetwork(VCchannelName);

    if (!DIDNetwork) {
      throw new Error("Fabric DID network not started.");
    }
    if (!VCNetwork) {
      throw new Error("Fabric VC network not started.");
    }

    console.log("✅ Connected to Fabric network.");
  } catch (err) {
    console.error("❌ Failed to connect to Fabric network:", err.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
})();
