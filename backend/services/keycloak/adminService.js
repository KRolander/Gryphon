/* ======================= IMPORTS ======================= */
const apiClient = require('../apiClient.js');

/* ======================= CONFIG ======================= */
async function getAdminToken() {
  const endpoint = '/realms/master/protocol/openid-connect/token';
  const body = {
    client_id: 'admin-cli',
    username: process.env.ADMIN_USERNAME | 'admin',
    password: process.env.ADMIN_PASSWORD | 'admin',
    grant_type: 'password',
  };
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const res = await apiClient.post(endpoint, body, { headers });

  return res.data.access_token;
}
module.exports = {
  getAdminToken,
};
