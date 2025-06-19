const { v4: uuidv4 } = require("uuid");

/**
 * Generates a new correlation ID
 * @returns {string} UUID v4 correlation ID
 */
function generateCorrelationId() {
  return uuidv4();
}

module.exports = {
  generateCorrelationId,
};
