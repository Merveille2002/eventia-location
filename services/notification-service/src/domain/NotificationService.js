/**
 * Contient la logique applicative du service des notifications.
 *
 * Cette classe est utilisée par les routes REST pour consulter l’historique ou
 * créer une notification. Elle doit construire une entité Notification,
 * vérifier sa validité, puis demander au dépôt de l’enregistrer.
 *
 * Travail demandé :
 * - recevoir le dépôt de notifications;
 * - fournir les opérations attendues par les routes;
 * - valider une notification avant sa persistance;
 * - signaler une notification incomplète ou invalide.
 *
 * Cette classe ne doit pas manipuler directement Express ou Mongoose.
 */
import Notification from "./Notification.js";

/**
 * Construit une erreur porteuse d'un code HTTP, pour que routes.js puisse
 * traduire directement les erreurs métier en réponse appropriée.
 */
function serviceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export default class NotificationService {
  /**
   * @param {import("./NotificationRepository.js").default} notificationRepository
   */
  constructor(notificationRepository) {
    if (!notificationRepository) {
      throw new TypeError("Le dépôt de notifications est obligatoire.");
    }

    this.notificationRepository = notificationRepository;
  }

  /**
   * Retourne l'historique des notifications.
   */
  async getAll() {
    return this.notificationRepository.findAll();
  }

  /**
   * Valide puis enregistre une nouvelle notification.
   */
  async create(data) {
    const notification = new Notification(data.recipient, data.message, data.type);
    const { valid, errors } = notification.isValid();

    if (!valid) {
      throw serviceError(errors.join(" "), 400);
    }

    return this.notificationRepository.create(notification);
  }
}
