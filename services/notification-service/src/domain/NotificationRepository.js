/**
 * Assure la persistance et la consultation des notifications.
 *
 * Cette classe encapsule le modèle Mongoose des notifications. Elle fournit
 * uniquement les opérations de stockage nécessaires au service et peut
 * organiser les résultats dans un ordre utile pour l’interface utilisateur.
 *
 * Travail demandé :
 * - recevoir et conserver le modèle Mongoose;
 * - enregistrer une nouvelle notification;
 * - récupérer l’historique des notifications;
 * - retourner les résultats de la base de données.
 *
 * Elle ne doit contenir aucune règle de validation métier.
 */
export default class NotificationRepository {
  /**
   * @param {import("mongoose").Model} notificationModel Modèle Mongoose de la notification.
   */
  constructor(notificationModel) {
    if (!notificationModel) {
      throw new TypeError("Le modèle Mongoose de la notification est obligatoire.");
    }

    this.notificationModel = notificationModel;
  }

  /**
   * Enregistre une nouvelle notification.
   */
  async create(notification) {
    return this.notificationModel.create(notification);
  }

  /**
   * Retourne l'historique des notifications, de la plus récente à la plus
   * ancienne.
   */
  async findAll() {
    return this.notificationModel.find().sort({ createdAt: -1 });
  }
}
