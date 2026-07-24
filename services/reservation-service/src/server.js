import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import createReservationRoutes from "./routes.js";
import ReservationRepository from "./domain/ReservationRepository.js";
import ReservationService from "./domain/ReservationService.js";

const reservationSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true },
    equipmentId: { type: String, required: true },
    clientName: { type: String },
    equipmentName: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: { type: Number },
    status: { type: String, enum: ["CONFIRMED", "CANCELLED"], default: "CONFIRMED" },
  },
  { timestamps: true }
);

const ReservationModel = mongoose.model("Reservation", reservationSchema);
const reservationRepository = new ReservationRepository(ReservationModel);
const reservationService = new ReservationService(reservationRepository);

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (req, res) => res.json({ service: "reservation-service", status: "UP" }));
app.use("/api/reservations", createReservationRoutes(reservationService));

const PORT = process.env.PORT || 4003;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`reservation-service sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error("Connexion MongoDB impossible :", err.message);
    process.exit(1);
  });
