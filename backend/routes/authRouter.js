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

    console.log('Admin Access Token:', adminAccessToken);

    // Create a new user
    //TODO: Implement a user data model - useful for validation
    const userCredentials = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
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

    await usersService.createUser(userCredentials, realmName, adminAccessToken);

    const userAccessToken = await usersService.loginUser(
      userCredentials,
      realmName
    );
    console.log('User Token:', userAccessToken);

    const userData = await usersService.getUserData(userAccessToken, realmName);

    res.status(200).send({ access_token: userAccessToken, user: userData });
  } catch (error) {
    res
      .status(500)
      .send('Signup failed. Please try again later.' + error.message);
  }
});

/**
 * Handles the login request
 * @route POST /auth/login
 * @returns {object} An object containing the access tokend
 * @returns {Error} 500 - Internal server error if login fails for any reason
 */
authRouter.post('/login', async (req, res) => {
  try {
    // Setup
    const userCredentials = {
      username: req.body.username,
      password: req.body.password,
    };
    const realmName = 'users';

    const userAccessToken = await usersService.loginUser(
      userCredentials,
      realmName
    );

    const userData = await usersService.getUserData(userAccessToken, realmName);
    res.status(200).send({ access_token: userAccessToken, user: userData });
  } catch (error) {
    res
      .status(500)
      .send('Login failed. Please try again later.\n' + error.message);
  }
});

module.exports = authRouter;
