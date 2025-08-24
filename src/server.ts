import app from "./app";
import { config } from "./config/environment";
import { logger } from "./core/utils/loggers";

app.start(config.port).catch((err) => {
  logger.error("Failed to start application:", err);
  process.exit(1);
});
