const app = require('./app');
const { startGateway, getNetwork } = require('./gateway');

const port = 3000;

(async () => {
  try {
    const gateway = await startGateway();
    const network = await getNetwork();

    if (!network) {
      throw new Error('Fabric network not started.');
    }

    console.log('✅ Connected to Fabric network.');
  } catch (err) {
    console.error('❌ Failed to connect to Fabric network:', err.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
})();
