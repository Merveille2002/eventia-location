import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import createNotificationRoutes from "./routes.js";
import NotificationRepository from "./domain/NotificationRepository.js";
import NotificationService from "./domain/NotificationService.js";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "GENERAL" },
  },
  { timestamps: true }
);

const NotificationModel = mongoose.model("Notification", notificationSchema);
const notificationRepository = new NotificationRepository(NotificationModel);
const notificationService = new NotificationService(notificationRepository);

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (req, res) => res.json({ service: "notification-service", status: "UP" }));
app.use("/api/notifications", createNotificationRoutes(notificationService));

const PORT = process.env.PORT || 4004;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`notification-service sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error("Connexion MongoDB impossible :", err.message);
    process.exit(1);
  });
