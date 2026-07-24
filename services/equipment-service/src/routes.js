import { Router } from "express";

/**
 * Enveloppe une route asynchrone pour traduire les erreurs du service
 * (avec leur propriété `status`) en réponse HTTP appropriée.
 */
function handle(action) {
  return async (req, res) => {
    try {
      await action(req, res);
    } catch (err) {
      if (err.name === "CastError") {
        return res.status(404).json({ message: "Matériel introuvable." });
      }

      res.status(err.status || 500).json({ message: err.message });
    }
  };
}

/**
 * Construit le routeur du service matériel à partir d'un EquipmentService
 * déjà configuré (injecté depuis server.js).
 */
export default function createEquipmentRoutes(equipmentService) {
  const router = Router();

  router.get("/", handle(async (req, res) => {
    const equipments = await equipmentService.getAll();
    res.status(200).json(equipments);
  }));

  router.get("/:id", handle(async (req, res) => {
    const equipment = await equipmentService.getById(req.params.id);
    res.status(200).json(equipment);
  }));

  router.post("/", handle(async (req, res) => {
    const equipment = await equipmentService.create(req.body);
    res.status(201).json(equipment);
  }));

  router.put("/:id", handle(async (req, res) => {
    const equipment = await equipmentService.update(req.params.id, req.body);
    res.status(200).json(equipment);
  }));

  router.put("/:id/reserve", handle(async (req, res) => {
    const equipment = await equipmentService.reserve(req.params.id, req.body.quantity);
    res.status(200).json(equipment);
  }));

  router.put("/:id/release", handle(async (req, res) => {
    const equipment = await equipmentService.release(req.params.id, req.body.quantity);
    res.status(200).json(equipment);
  }));

  router.delete("/:id", handle(async (req, res) => {
    await equipmentService.remove(req.params.id);
    res.status(204).send();
  }));

  return router;
}
