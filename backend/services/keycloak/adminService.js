/* ======================= IMPORTS ======================= */
const apiClient = require('../apiClient.js');

/* ======================= CONFIG ======================= */
let adminToken = null;

async function getAdminToken() {
  // If the admin token is already set, return it
  if (adminToken) {
    return adminToken;
  }

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

  const res = await apiClient.post(endpoint, body, { headers });
  adminToken = res.data.access_token;
  return adminToken;
}
module.exports = {
  getAdminToken,
};
