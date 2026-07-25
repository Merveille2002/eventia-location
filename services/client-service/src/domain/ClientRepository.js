/**
 * Assure l’accès aux données persistantes des clients.
 *
 * Cette classe reçoit le modèle Mongoose du client et centralise toutes les
 * opérations effectuées dans MongoDB. Elle doit permettre au reste du service
 * de consulter, ajouter, modifier et supprimer des clients sans manipuler
 * directement Mongoose.
 *
 * Travail demandé :
 * - conserver une référence vers le modèle Mongoose fourni;
 * - prévoir les opérations de persistance nécessaires aux contrats REST;
 * - retourner les résultats produits par Mongoose.
 *
 * Cette classe ne doit contenir ni validation métier ni traitement HTTP.
 */
export default class ClientRepository {
  /**
   * @param {import("mongoose").Model} clientModel Modèle Mongoose du client.
   */
  constructor(clientModel) {
    if (!clientModel) {
      throw new TypeError("Le modèle Mongoose du client est obligatoire.");
    }

    this.clientModel = clientModel;
  }

  /**
   * Retourne tous les clients enregistrés.
   */
  async findAll() {
    return this.clientModel.find();
  }

  /**
   * Recherche un client à partir de son identifiant.
   */
  async findById(id) {
    return this.clientModel.findById(id);
  }

  /**
   * Recherche un client à partir de son courriel.
   */
  async findByEmail(email) {
    return this.clientModel.findOne({ email });
  }

  /**
   * Enregistre un nouveau client.
   */
  async create(client) {
    return this.clientModel.create(client);
  }

  /**
   * Modifie un client et retourne sa version mise à jour.
   */
  async update(id, data) {
    return this.clientModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Supprime un client.
   */
  async delete(id) {
    await this.clientModel.findByIdAndDelete(id);
  }
}
