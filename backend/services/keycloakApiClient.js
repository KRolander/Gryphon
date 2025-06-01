/* ======================= IMPORTS ======================= */
const axios = require('axios');

// ======================= CONFIG ======================= */
const keycloakApiClient = axios.create({
  baseURL: 'http://localhost:8080/',
});

module.exports = keycloakApiClient;
