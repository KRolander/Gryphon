const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const didRouter = require("./routes/did");
// const vcRouter = require("./routes/vc"); to be uncommented after adding a router for VCs
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("O zi buna!");
});

app.use("/did", didRouter);
// app.use("/vc", vcRouter); t be uncommented after adding a rounter for VCs

module.exports = app;