/**
 * Orchestre le cas d’utilisation principal de réservation.
 *
 * Cette classe coordonne l’entité Reservation, son dépôt et les autres
 * microservices. Pour confirmer une réservation, elle doit vérifier les
 * données, obtenir les informations du client et du matériel, réserver la
 * quantité demandée, calculer le total, enregistrer la réservation et produire
 * une notification. Pour une annulation, elle doit remettre le matériel en
 * disponibilité, changer l’état de la réservation et produire une nouvelle
 * notification.
 *
 * Travail demandé :
 * - recevoir le dépôt de réservations.
 * - configurer les adresses des services externes à partir de l’environnement.
 * - fournir les opérations prévues par les contrats REST.
 * - utiliser Axios pour communiquer avec les autres services.
 * - gérer les erreurs : données invalides, ressource absente, stock insuffisant
 *   et réservation déjà annulée.
 * - préserver la cohérence des données autant que possible.
 *
 * Cette classe ne doit pas manipuler directement les objets req et res et ne
 * doit pas exécuter directement de requêtes Mongoose.
 */
import axios from "axios";
import Reservation from "./Reservation.js";

/**
 * Construit une erreur porteuse d'un code HTTP, pour que routes.js puisse
 * traduire directement les erreurs métier en réponse appropriée.
 */
function serviceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * Traduit une erreur Axios (réponse d'un autre microservice, ou service
 * injoignable) en erreur applicative exploitable par routes.js.
 */
function externalServiceError(error, fallbackMessage, fallbackStatus = 502) {
  if (error.response) {
    return serviceError(error.response.data?.message || fallbackMessage, error.response.status);
  }

  return serviceError(fallbackMessage, fallbackStatus);
}

export default class ReservationService {
  /**
   * @param {import("./ReservationRepository.js").default} reservationRepository
   */
  constructor(reservationRepository) {
    if (!reservationRepository) {
      throw new TypeError("Le dépôt de réservations est obligatoire.");
    }

    this.reservationRepository = reservationRepository;
    this.clientServiceUrl = process.env.CLIENT_SERVICE_URL || "http://localhost:4001/api/clients";
    this.equipmentServiceUrl = process.env.EQUIPMENT_SERVICE_URL || "http://localhost:4002/api/equipments";
    this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4004/api/notifications";
  }

  /**
   * Retourne toutes les réservations.
   */
  async getAll() {
    return this.reservationRepository.findAll();
  }

  /**
   * Crée une réservation : valide les données, vérifie le client et le
   * matériel, réserve la quantité demandée, calcule le total, enregistre la
   * réservation puis produit une notification de confirmation.
   */
  async create(data) {
    const reservation = new Reservation(data.clientId, data.equipmentId, data.quantity, data.startDate, data.endDate);
    const { valid, errors } = reservation.isValid();

    if (!valid) {
      throw serviceError(errors.join(" "), 400);
    }

    const client = await this.#fetchClient(reservation.clientId);
    const equipment = await this.#fetchEquipment(reservation.equipmentId);

    let stockReserved = false;
    let savedReservation = null;

    try {
      await this.#reserveStock(reservation.equipmentId, reservation.quantity);
      stockReserved = true;

      reservation.clientName = client.name;
      reservation.clientEmail = client.email;
      reservation.equipmentName = equipment.name;
      reservation.calculateTotal(equipment.dailyPrice);

      savedReservation = await this.reservationRepository.create(reservation);

      await this.#notify(
        client.email,
        `Réservation confirmée pour ${reservation.equipmentName} (x${reservation.quantity}) du ` +
          `${reservation.startDate.toISOString().slice(0, 10)} au ${reservation.endDate.toISOString().slice(0, 10)}. ` +
          `Total : ${reservation.totalPrice} $.`,
        "RESERVATION_CONFIRMED",
      );

      return savedReservation;
    } catch (error) {
      if (savedReservation?._id) {
        await this.#compensate(
          () => this.reservationRepository.delete(savedReservation._id),
          "suppression de la réservation",
        );
      }

      if (stockReserved) {
        await this.#compensate(
          () => this.#releaseStock(reservation.equipmentId, reservation.quantity),
          "remise en stock",
        );
      }

      throw error;
    }
  }

  /**
   * Annule une réservation confirmée : remet le matériel en disponibilité,
   * change le statut de la réservation puis produit une notification
   * d'annulation.
   */
  async cancel(id) {
    const reservation = await this.reservationRepository.findById(id);

    if (!reservation) {
      throw serviceError("Réservation introuvable.", 404);
    }

    if (reservation.status === "CANCELLED") {
      throw serviceError("Cette réservation est déjà annulée.", 400);
    }

    const updatedReservation =
      await this.reservationRepository.cancelIfConfirmed(id);

    if (!updatedReservation) {
      throw serviceError("Cette réservation est déjà annulée.", 400);
    }

    try {
      await this.#releaseStock(reservation.equipmentId, reservation.quantity);
    } catch (error) {
      await this.#compensate(
        () => this.reservationRepository.update(id, { status: "CONFIRMED" }),
        "restauration du statut de la réservation",
      );
      throw error;
    }

    await this.#notify(
      reservation.clientEmail || reservation.clientName,
      `Réservation annulée pour ${reservation.equipmentName} (x${reservation.quantity}).`,
      "RESERVATION_CANCELLED",
    );

    return updatedReservation;
  }

  /**
   * Supprime définitivement une réservation, après avoir confirmé son
   * existence. Contrairement à cancel(), cette opération ne remet pas le
   * matériel en disponibilité : la remise en stock est une conséquence
   * métier de l'annulation, pas de la suppression d'un enregistrement.
   */
  async remove(id) {
    const reservation = await this.reservationRepository.findById(id);

    if (!reservation) {
      throw serviceError("Réservation introuvable.", 404);
    }

    await this.reservationRepository.delete(id);
  }

  async #fetchClient(clientId) {
    try {
      const response = await axios.get(`${this.clientServiceUrl}/${clientId}`);
      return response.data;
    } catch (error) {
      throw externalServiceError(error, "Client introuvable.", 404);
    }
  }

  async #fetchEquipment(equipmentId) {
    try {
      const response = await axios.get(`${this.equipmentServiceUrl}/${equipmentId}`);
      return response.data;
    } catch (error) {
      throw externalServiceError(error, "Matériel introuvable.", 404);
    }
  }

  async #reserveStock(equipmentId, quantity) {
    try {
      await axios.put(`${this.equipmentServiceUrl}/${equipmentId}/reserve`, { quantity });
    } catch (error) {
      throw externalServiceError(error, "Quantité disponible insuffisante.", 409);
    }
  }

  async #releaseStock(equipmentId, quantity) {
    try {
      await axios.put(`${this.equipmentServiceUrl}/${equipmentId}/release`, { quantity });
    } catch (error) {
      throw externalServiceError(error, "Impossible de remettre le matériel en disponibilité.");
    }
  }

  async #notify(recipient, message, type) {
    try {
      await axios.post(this.notificationServiceUrl, { recipient, message, type });
    } catch (error) {
      throw externalServiceError(error, "Impossible d'enregistrer la notification.");
    }
  }

  async #compensate(action, operation) {
    try {
      await action();
    } catch (error) {
      console.error(`Échec de compensation (${operation}) :`, error.message);
    }
  }
}
