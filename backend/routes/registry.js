const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Logger
const logger = require("../utility/logger");
const { generateCorrelationId } = require("../utility/loggerUtils");

/**
 * This function is meant to fetch the public registry
 * of an organization
 */
router.get("/:org", (req, res) => {
  const correlationId = generateCorrelationId();
  const org = req.params.org.toLowerCase(); // e.g., "university"
  const filePath = path.join(__dirname, "../../registries", `${org}.json`);

  if (!fs.existsSync(filePath)) {
    const warningMessage = "Registry not found for this organization";
    logger.warn({
      action: `GET /registry/${org}`,
      correlationId: correlationId,
      message: warningMessage,
    });
    return res.status(404).send(warningMessage);
  }

  const registry = JSON.parse(fs.readFileSync(filePath));
  logger.info({
    action: `GET /registry/${org}`,
    correlationId: correlationId,
    message: "Registry fetched successfully",
  });
  res.json(registry);
});

module.exports = router;
