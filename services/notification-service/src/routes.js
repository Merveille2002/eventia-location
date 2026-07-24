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
      res.status(err.status || 500).json({ message: err.message });
    }
  };
}

/**
 * Construit le routeur du service notifications à partir d'un
 * NotificationService déjà configuré (injecté depuis server.js).
 */
export default function createNotificationRoutes(notificationService) {
  const router = Router();

  router.get("/", handle(async (req, res) => {
    const notifications = await notificationService.getAll();
    res.status(200).json(notifications);
  }));

  router.post("/", handle(async (req, res) => {
    const notification = await notificationService.create(req.body);
    res.status(201).json(notification);
  }));

  return router;
}
