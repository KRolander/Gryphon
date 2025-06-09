const axios = require('axios');
/**
 * This function is used to retrieve the public registry of
 * an organization
 * @param {string} url the service endpoint of an organization
 * @returns the public registry of the organization orgName
 */
async function fetchRegistry(url) {
    try {
        const response = await axios.get(url);
        const registry = response.data;
        console.log("Fetched registry:", registry);
        return registry;
    } catch (error) {
        if (error.response) {
            console.error("Error:", error.response.status, error.response.data);
        } else {
            console.error("Network or server error:", error.message);
        }
    return null;
  }
}

module.exports = {
    fetchRegistry
}