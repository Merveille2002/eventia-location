import { Router } from "express";

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function createClientRouter(clientService) {
  const router = Router();

  function getClientService(req) {
    const service = clientService ?? req.app.locals.clientService;

    if (!service) {
      throw new Error("ClientService n'est pas configuré.");
    }

    return service;
  }

  router.get(
    "/",
    asyncRoute(async (req, res) => {
      const clients = await getClientService(req).getAllClients();
      res.status(200).json(clients);
    }),
  );

  router.get(
    "/:id",
    asyncRoute(async (req, res) => {
      const client = await getClientService(req).getClientById(req.params.id);

      if (!client) {
        return res.status(404).json({ message: "Client introuvable." });
      }

      return res.status(200).json(client);
    }),
  );

  router.post(
    "/",
    asyncRoute(async (req, res) => {
      const client = await getClientService(req).createClient(req.body);
      res.status(201).json(client);
    }),
  );

  router.put(
    "/:id",
    asyncRoute(async (req, res) => {
      const client = await getClientService(req).updateClient(
        req.params.id,
        req.body,
      );
      res.status(200).json(client);
    }),
  );

  router.delete(
    "/:id",
    asyncRoute(async (req, res) => {
      await getClientService(req).deleteClient(req.params.id);
      res.status(204).send();
    }),
  );

  router.use((error, _req, res, _next) => {
    if (error.code === "CLIENT_NOT_FOUND" || error.name === "CastError") {
      return res.status(404).json({ message: "Client introuvable." });
    }

    if (error.code === "INVALID_CLIENT") {
      return res.status(400).json({
        message: error.message,
        errors: error.details,
      });
    }

    if (error.code === "EMAIL_ALREADY_USED" || error.code === 11000) {
      return res.status(409).json({
        message: "Ce courriel est déjà utilisé par un autre client.",
      });
    }

    console.error(error);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  });

  return router;
}

export default createClientRouter();
