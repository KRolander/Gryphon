/* ======================= IMPORTS ======================= */
const keycloakApiClient = require('../keycloakApiClient.js');

/* ======================= CONFIG ======================= */
let adminToken = null;

/**
 * Retrieves the admin token necessary to perform administrative actions in Keycloak.
 * @returns {string} The admin token
 */
async function getAdminToken() {
  // If the admin token is already set, return it
  // TODO: look into related issue #45
  // if (adminToken) {
  //   return adminToken;
  // }

  // Else, fetch a new admin token from Keycloak
  const endpoint = '/realms/master/protocol/openid-connect/token';
  const body = {
    client_id: 'admin-cli',
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin',
    grant_type: 'password',
  };
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const res = await keycloakApiClient.post(endpoint, body, { headers });
  adminToken = res.data.access_token;
  return adminToken;
}

/**
 * Creates a new realm in Keycloak using the provided realm name.
 * @param {string} realmName - The name of the new realm
 */
async function createRealm(realmName) {
  // TODO: implement the logic to create a new realm in Keycloak
}

module.exports = {
  getAdminToken,
  createRealm,
};
