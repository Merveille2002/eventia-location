/**
 * Contient la logique applicative du service du matériel.
 *
 * Cette classe orchestre l’entité Equipment et son dépôt. Elle doit gérer le
 * catalogue, valider les nouveaux articles et appliquer les règles de stock
 * lors d’une réservation ou d’une remise en disponibilité.
 *
 * Travail demandé :
 * - recevoir le dépôt de matériel;
 * - exposer les opérations requises par les contrats REST;
 * - valider les données avant la création;
 * - empêcher une réservation lorsque le matériel est absent ou insuffisant;
 * - diminuer ou augmenter la quantité disponible de façon cohérente;
 * - produire des erreurs compréhensibles lorsque l’opération est impossible.
 *
 * Cette classe ne doit pas traiter directement les objets req et res.
 */
import Equipment from "./Equipment.js";

/**
 * Construit une erreur porteuse d'un code HTTP, pour que routes.js puisse
 * traduire directement les erreurs métier en réponse appropriée.
 */
function serviceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export default class EquipmentService {
  /**
   * @param {import("./EquipmentRepository.js").default} equipmentRepository
   */
  constructor(equipmentRepository) {
    if (!equipmentRepository) {
      throw new TypeError("Le dépôt de matériel est obligatoire.");
    }

    this.equipmentRepository = equipmentRepository;
  }

  /**
   * Retourne tout le catalogue.
   */
  async getAll() {
    return this.equipmentRepository.findAll();
  }

  /**
   * Retourne un matériel précis ou signale son absence (404).
   */
  async getById(id) {
    const equipment = await this.equipmentRepository.findById(id);

    if (!equipment) {
      throw serviceError("Matériel introuvable.", 404);
    }

    return equipment;
  }

  /**
   * Valide puis enregistre un nouveau matériel.
   */
  async create(data) {
    const equipment = new Equipment(data.name, data.category, data.dailyPrice, data.availableQuantity);
    const { valid, errors } = equipment.isValid();

    if (!valid) {
      throw serviceError(errors.join(" "), 400);
    }

    return this.equipmentRepository.create(equipment);
  }

  /**
   * Valide puis remplace les informations d'un matériel existant.
   */
  async update(id, data) {
    const equipment = new Equipment(data.name, data.category, data.dailyPrice, data.availableQuantity);
    const { valid, errors } = equipment.isValid();

    if (!valid) {
      throw serviceError(errors.join(" "), 400);
    }

    const updated = await this.equipmentRepository.update(id, equipment);

    if (!updated) {
      throw serviceError("Matériel introuvable.", 404);
    }

    return updated;
  }

  /**
   * Supprime un matériel après avoir confirmé son existence.
   */
  async remove(id) {
    await this.getById(id);
    await this.equipmentRepository.delete(id);
  }

  /**
   * Diminue le stock disponible lors d'une réservation.
   *
   * Distingue le matériel introuvable (404) du stock insuffisant (409) en
   * revérifiant l'existence uniquement lorsque l'ajustement atomique échoue.
   */
  async reserve(id, quantity) {
    const requested = Number(quantity);

    if (!Number.isInteger(requested) || requested <= 0) {
      throw serviceError("La quantité demandée doit être un entier positif.", 400);
    }

    const equipment = await this.equipmentRepository.decreaseQuantity(id, requested);

    if (!equipment) {
      const existing = await this.equipmentRepository.findById(id);

      if (!existing) {
        throw serviceError("Matériel introuvable.", 404);
      }

      throw serviceError("Quantité disponible insuffisante.", 409);
    }

    return equipment;
  }

  /**
   * Remet une quantité dans le stock disponible lors d'une annulation.
   */
  async release(id, quantity) {
    const requested = Number(quantity);

    if (!Number.isInteger(requested) || requested <= 0) {
      throw serviceError("La quantité à remettre doit être un entier positif.", 400);
    }

    const equipment = await this.equipmentRepository.increaseQuantity(id, requested);

    if (!equipment) {
      throw serviceError("Matériel introuvable.", 404);
    }

    return equipment;
  }
}
