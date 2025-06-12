const pino = require("pino");
const fs = require("fs");
const path = require("path");

const logDirectory = path.resolve(__dirname, "../../logging/logs/backend");
const logFilePath = path.join(logDirectory, "backend.log");

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logger = pino(
  {
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  },
  pino.destination({ dest: logFilePath, append: true })
);

module.exports = logger;
