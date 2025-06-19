/* ======================= IMPORTS ======================= */
const axios = require("axios");

// ======================= CONFIG ======================= */
const keycloakApiClient = axios.create({
  baseURL: "http://host.docker.internal:9090/",
});

module.exports = keycloakApiClient;
