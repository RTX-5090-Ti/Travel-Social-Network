import dotenv from "dotenv";
import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startTripTrashCleanupJob } from "./services/tripTrashCleanup.service.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
    startTripTrashCleanupJob();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

bootstrap();
