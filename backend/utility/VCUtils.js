const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Logger
const logger = require("./logger");
/**
 * This function is used to retrieve the public registry of
 * an organization
 * @param {string} url the service endpoint of an organization
 * @returns the public registry of the organization orgName
 */
async function fetchRegistry(url, correlationId = "unknown") {
  try {
    const response = await axios.get(url);
    const registry = response.data;
    console.log("Fetched registry:", registry);
    logger.info({
      action: "fetchRegistry",
      correlationId: correlationId,
      message: "Fetched successfully",
    });
    return registry;
  } catch (error) {
    if (error.response) {
      console.error("Error:", error.response.status, error.response.data);
      logger.warn({
        action: "fetchRegistry",
        correlationId: correlationId,
        message: `Error with status ${error.response.status}`,
      });
    } else {
      console.error("Network or server error:", error.message);
      logger.warn({
        action: "fetchRegistry",
        correlationId: correlationId,
        message: "Network or server error",
      });
    }
    return null;
  }
}

function isRoot(did) {
  const configPath = path.join(__dirname, "..", "config", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  return did === config.rootTAO.did;
}

module.exports = {
  fetchRegistry,
  isRoot,
};
