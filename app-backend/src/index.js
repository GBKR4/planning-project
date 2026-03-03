import app from "./app.js";
import { startScheduler } from "./services/notifications/notificationScheduler.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start notification scheduler
  startScheduler();
});