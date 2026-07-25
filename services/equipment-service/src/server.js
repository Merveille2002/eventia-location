import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import createEquipmentRoutes from "./routes.js";
import EquipmentRepository from "./domain/EquipmentRepository.js";
import EquipmentService from "./domain/EquipmentService.js";

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  dailyPrice: { type: Number, required: true, min: 0 },
  availableQuantity: { type: Number, required: true, min: 0 },
});

const EquipmentModel = mongoose.model("Equipment", equipmentSchema);
const equipmentRepository = new EquipmentRepository(EquipmentModel);
const equipmentService = new EquipmentService(equipmentRepository);

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (req, res) => res.json({ service: "equipment-service", status: "UP" }));
app.use("/api/equipments", createEquipmentRoutes(equipmentService));

const PORT = process.env.PORT || 4002;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`equipment-service sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error("Connexion MongoDB impossible :", err.message);
    process.exit(1);
  });
