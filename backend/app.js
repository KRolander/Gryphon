/* ======================== IMPORTS ======================== */
// core
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

// routers
const authRouter = require('./routes/authRouter.js');
const didRouter = require('./routes/did');
const registryRouter = require('../registry_routes/registry.js');
const { router: vcRouter } = require('./routes/vc');

/* ======================== CONFIG ======================== */
// Create the Express app
const app = express();
dotenv.config();

// Register core middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Register routers
app.use('/did', didRouter);
app.use('/auth', authRouter);
app.use('/vc', vcRouter);
app.use('/registry', registryRouter);

module.exports = app;
