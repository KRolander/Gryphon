const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Logger
const logger = require("../utility/logger");
const { generateCorrelationId } = require("../utility/loggerUtils");

/**
 * @route GET /registry/:org
 * @summary Gets the content of the registry of a provided organization
 * @description This method builds the path to the registry of the organization provided and checks if the registry
 * exists at the built path. If it does, it reads the file and returns its content as a JSON object
 *
 * @param {object} req.params - The parameters of the request
 * @param {string} req.params.org - The organization for which you want to fetch data from the registry
 *
 * @returns {string} 404: "Registry not found for this organization" if something went wrong when reading the registry
 * @returns {object} 200: A JSON object with the contents of the registry
 */
router.get("/:org", (req, res) => {
  const correlationId = generateCorrelationId();
  const org = req.params.org.toLowerCase(); // e.g., "university"
  const filePath = path.join(__dirname, "../../registries", `${org}.json`);

  if (!fs.existsSync(filePath)) {
    const warningMessage = "Registry not found for this organization";
    logger.warn({
      action: "GET /registry/registry",
      correlationId: correlationId,
      message: warningMessage,
    });
    return res.status(404).send(warningMessage);
  }

  const registry = JSON.parse(fs.readFileSync(filePath));
  logger.info({
    action: "GET /registry/registry",
    correlationId: correlationId,
    message: "Registry fetched successfully",
  });
  res.status(200).json(registry);
});

module.exports = router;
