import app from "./app.js";
import { startScheduler } from "./services/notifications/notificationScheduler.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);

  // Start notification scheduler
  startScheduler();
});