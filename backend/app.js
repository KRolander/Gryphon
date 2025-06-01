const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const didRouter = require("./routes/did");
const { router: vcRouter } = require("./routes/vc"); 
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("O zi buna!");
});

app.use("/did", didRouter);
app.use("/vc", vcRouter); 

module.exports = app;