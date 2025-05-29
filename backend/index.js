/* ------------------- IMPORTS ------------------- */
// core
const bodyParser = require("body-parser");
const cors = require("cors");

// routes
const didRouter = require("./routes/did");
/* ------------------- CONFIG ------------------- */
const app = require("express")();
const port = 3000;

/* ------------------- CORE ------------------- */
// register plugins
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);
app.use(cors());

app.get("/", (req, res) => {
  res.send("O zi buna!");
});

// register routes
app.use("/did", didRouter);

const { startGateway, getContract, getNetwork } = require("./gateway");

(async () => {
  try {
    const gateway = await startGateway();
    const network = await getNetwork();

    if (!network) {
      throw new Error(
        "Fabric network not started. Make sure the network is up."
      );
    }

    console.log("✅ Connected to Fabric network.");
  } catch (err) {
    console.error("❌ Failed to connect to Fabric network:", err.message);
    process.exit(1); // Exit the process on failure
  }
})();

// start server
app.listen(port, () => {
  console.log(`Gateway setup`);
});
