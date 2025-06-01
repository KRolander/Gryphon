/* ======================= IMPORTS ======================= */
// core
const express = require('express');
const bodyParser = require('body-parser');

// API
const adminService = require('../services/keycloak/adminService.js');
const usersService = require('../services/keycloak/usersService.js');
const { credentials } = require('@grpc/grpc-js');

// ======================= CONFIG ======================= */
const authRouter = express.Router();

/**
 * Handles the signup request
 * @route POST /auth/signup
 * @returns {object} An object containing the access tokend
 * @returns {Error} 500 - Internal server error if signup fails for any reason
 */
authRouter.post('/signup', async (req, res) => {
  try {
    // Retrieve the access token
    const adminAccessToken = await adminService.getAdminToken();

    console.log(req.body);

    // Create a new user
    //TODO: Implement a user data model - useful for validation
    const userData = {
      username: req.body.username,
      email: req.body.email,
      credentials: [
        {
          type: 'password',
          value: req.body.password,
          temporary: false, // Set to false to avoid requiring password change on first login
        },
      ],
      emailVerified: true,
      enabled: true,
      requiredActions: [],
      groups: [],
      // firstName: req.body.firstName || '', // optional
      // lastName: req.body.lastName || '', // optional
    };

    //! REAL NAME IS HARDCODED FOR NOW. BEFORE DOING ANYTHING, YOU MUST MANUALLY CREATE
    //! THIS REALM IN KEYCLOAK
    const realmName = 'users';

    await usersService.createUser(userData, realmName, adminAccessToken);

    const userToken = await usersService.loginUser(userData, realmName);
    console.log('User Token:', userToken);

    res.status(200).send({ access_token: userToken });
  } catch (error) {
    res.status(500).send('Signup failed. Please try again later.');
  }
});

module.exports = authRouter;
