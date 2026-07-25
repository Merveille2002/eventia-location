import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createClientRouter } from "./routes.js";
import ClientRepository from "./domain/ClientRepository.js";
import ClientService from "./domain/ClientService.js";

dotenv.config();

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const ClientModel =
  mongoose.models.Client ?? mongoose.model("Client", clientSchema);
const clientRepository = new ClientRepository(ClientModel);
const clientService = new ClientService(clientRepository);

const app = express();
const port = Number(process.env.PORT) || 4001;
const mongoUri =
  process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/eventia_clients";

app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) =>
  res.json({ service: "client-service", status: "UP" }),
);
app.use("/api/clients", createClientRouter(clientService));

async function start() {
  try {
    await mongoose.connect(mongoUri);
    app.listen(port, () =>
      console.log(`client-service sur le port ${port}`),
    );
  } catch (error) {
    console.error("Connexion à MongoDB impossible.", error);
    process.exitCode = 1;
  }
}

start();
