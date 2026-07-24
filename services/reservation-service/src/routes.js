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
        return res.status(404).json({ message: "Réservation introuvable." });
      }

      res.status(err.status || 500).json({ message: err.message });
    }
  };
}

/**
 * Construit le routeur du service réservations à partir d'un
 * ReservationService déjà configuré (injecté depuis server.js).
 */
export default function createReservationRoutes(reservationService) {
  const router = Router();

  router.get("/", handle(async (req, res) => {
    const reservations = await reservationService.getAll();
    res.status(200).json(reservations);
  }));

  router.post("/", handle(async (req, res) => {
    const reservation = await reservationService.create(req.body);
    res.status(201).json(reservation);
  }));

  const cancelReservation = handle(async (req, res) => {
    const reservation = await reservationService.cancel(req.params.id);
    res.status(200).json(reservation);
  });

  // Contrat REST officiel de l'énoncé.
  router.put("/:id/cancel", cancelReservation);

  // Compatibilité avec le frontend fourni, qui utilise PATCH.
  router.patch("/:id/cancel", cancelReservation);

  router.delete("/:id", handle(async (req, res) => {
    await reservationService.remove(req.params.id);
    res.status(204).send();
  }));

  return router;
}
