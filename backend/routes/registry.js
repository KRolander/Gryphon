const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

/**
 * This function is meant to fetch the public registry 
 * of an organization
 */
router.get("/:org", (req, res) => {
  const org = req.params.org.toLowerCase(); // e.g., "university"
  const filePath = path.join(__dirname, "../../registries", `${org}.json`);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Registry not found for this organization.");
  }

  const registry = JSON.parse(fs.readFileSync(filePath));
  res.json(registry);
});

module.exports = router;