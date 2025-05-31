/* ======================= IMPORTS ======================= */
const axios = require('axios');

// ======================= CONFIG ======================= */
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/',
});

module.exports = apiClient;
