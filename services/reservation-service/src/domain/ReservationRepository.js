/**
 * Assure l’accès aux réservations stockées dans MongoDB.
 *
 * Cette classe encapsule le modèle Mongoose et fournit les opérations de
 * persistance nécessaires à la création, la consultation et la modification
 * de l’état d’une réservation.
 *
 * Travail demandé :
 * - conserver le modèle Mongoose reçu.
 * - récupérer les réservations dans un ordre utile.
 * - retrouver une réservation précise.
 * - enregistrer une nouvelle réservation.
 * - modifier une réservation existante et retourner sa nouvelle version.
 *
 * Les appels aux autres microservices ne doivent pas être placés ici.
 */
export default class ReservationRepository {
  /**
   * @param {import("mongoose").Model} reservationModel Modèle Mongoose de la réservation.
   */
  constructor(reservationModel) {
    if (!reservationModel) {
      throw new TypeError("Le modèle Mongoose de la réservation est obligatoire.");
    }

    this.reservationModel = reservationModel;
  }

  /**
   * Retourne les réservations, de la plus récente à la plus ancienne.
   */
  async findAll() {
    return this.reservationModel.find().sort({ createdAt: -1 });
  }

  /**
   * Recherche une réservation à partir de son identifiant.
   */
  async findById(id) {
    return this.reservationModel.findById(id);
  }

  /**
   * Enregistre une nouvelle réservation.
   */
  async create(reservation) {
    return this.reservationModel.create(reservation);
  }

  /**
   * Modifie une réservation existante (par exemple son statut) et retourne
   * sa nouvelle version.
   */
  async update(id, data) {
    return this.reservationModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Supprime une réservation.
   */
  async delete(id) {
    await this.reservationModel.findByIdAndDelete(id);
  }
}
