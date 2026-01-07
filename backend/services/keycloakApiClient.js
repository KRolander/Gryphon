/* ======================= IMPORTS ======================= */
const axios = require("axios");

// ======================= CONFIG ======================= */
const keycloakApiClient = axios.create({
  baseURL: "http://keycloak:8080/",
});

module.exports = keycloakApiClient;
