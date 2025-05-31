/* ======================= IMPORTS ======================= */
// core
const express = require('express');
const bodyParser = require('body-parser');

// API
const adminService = require('../services/keycloak/adminService.js');

// ======================= CONFIG ======================= */
const authRouter = express.Router();

/* -------------- SIGNUP -------------- */
authRouter.post('/signup', async (req, res) => {
  try {
    const access_token = await adminService.getAdminToken();

    res.status(200).send({ access_token });
  } catch (error) {
    console.log(error);
    res.status(501).send('Signup failed');
  }
});

module.exports = authRouter;
