/**
 * Assure l’accès aux données persistantes du matériel.
 *
 * Cette classe encapsule le modèle Mongoose et fournit les opérations dont le
 * service a besoin pour gérer le catalogue et les quantités disponibles. Les
 * autres classes ne doivent pas avoir à connaître les détails des requêtes
 * MongoDB.
 *
 * Travail demandé :
 * - conserver le modèle Mongoose fourni;
 * - permettre la consultation et le CRUD du matériel;
 * - permettre l’ajustement atomique d’une quantité disponible;
 * - retourner les documents obtenus après chaque opération.
 *
 * Les règles de disponibilité et de validation appartiennent au domaine ou au
 * service applicatif, pas à cette classe.
 */
export default class EquipmentRepository {
  /**
   * @param {import("mongoose").Model} equipmentModel Modèle Mongoose du matériel.
   */
  constructor(equipmentModel) {
    if (!equipmentModel) {
      throw new TypeError("Le modèle Mongoose du matériel est obligatoire.");
    }

    this.equipmentModel = equipmentModel;
  }

  /**
   * Retourne tout le catalogue de matériel.
   */
  async findAll() {
    return this.equipmentModel.find();
  }

  /**
   * Recherche un matériel à partir de son identifiant.
   */
  async findById(id) {
    return this.equipmentModel.findById(id);
  }

  /**
   * Enregistre un nouveau matériel.
   */
  async create(equipment) {
    return this.equipmentModel.create(equipment);
  }

  /**
   * Modifie un matériel et retourne sa version mise à jour.
   */
  async update(id, data) {
    return this.equipmentModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Supprime un matériel.
   */
  async delete(id) {
    await this.equipmentModel.findByIdAndDelete(id);
  }

  /**
   * Retire atomiquement une quantité du stock disponible.
   *
   * La condition sur availableQuantity garantit que la soustraction n'a lieu
   * que si le stock est suffisant, ce qui évite les quantités négatives en
   * cas d'appels concurrents. Retourne null lorsque le stock est insuffisant
   * ou que le matériel est introuvable.
   */
  async decreaseQuantity(id, quantity) {
    return this.equipmentModel.findOneAndUpdate(
      { _id: id, availableQuantity: { $gte: quantity } },
      { $inc: { availableQuantity: -quantity } },
      { new: true }
    );
  }

  /**
   * Remet atomiquement une quantité dans le stock disponible.
   */
  async increaseQuantity(id, quantity) {
    return this.equipmentModel.findByIdAndUpdate(
      id,
      { $inc: { availableQuantity: quantity } },
      { new: true, runValidators: true }
    );
  }
}
