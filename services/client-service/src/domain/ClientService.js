/**
 * Contient la logique applicative du service des clients.
 *
 * Cette classe constitue l’intermédiaire entre les routes REST, l’entité
 * Client et le dépôt de clients. Elle doit appliquer les règles métier avant
 * de demander au dépôt de lire ou de modifier les données.
 *
 * Travail demandé :
 * - recevoir le dépôt nécessaire à son fonctionnement;
 * - offrir les opérations correspondant aux cas d’utilisation du service;
 * - créer et valider l’entité appropriée avant un enregistrement;
 * - déléguer la persistance au dépôt;
 * - signaler clairement les données invalides.
 *
 * Cette classe ne doit pas utiliser directement Express ni Mongoose.
 */
import Client from "./Client.js";

function businessError(message, code, details = []) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function sameId(left, right) {
  return left != null && right != null && String(left) === String(right);
}

export default class ClientService {
  constructor(clientRepository) {
    if (!clientRepository) {
      throw new TypeError("Le dépôt de clients est obligatoire.");
    }

    this.clientRepository = clientRepository;
  }

  async getAllClients() {
    return this.clientRepository.findAll();
  }

  async getClientById(id) {
    return this.clientRepository.findById(id);
  }

  async createClient(data = {}) {
    const client = this.#createValidClient(data);
    const clientWithSameEmail = await this.clientRepository.findByEmail(
      client.email,
    );

    if (clientWithSameEmail) {
      throw businessError(
        "Ce courriel est déjà utilisé par un autre client.",
        "EMAIL_ALREADY_USED",
      );
    }

    return this.clientRepository.create(client);
  }

  async updateClient(id, data = {}) {
    const existingClient = await this.clientRepository.findById(id);

    if (!existingClient) {
      throw businessError("Client introuvable.", "CLIENT_NOT_FOUND");
    }

    const client = this.#createValidClient(data);
    const clientWithSameEmail = await this.clientRepository.findByEmail(
      client.email,
    );

    if (
      clientWithSameEmail &&
      !sameId(clientWithSameEmail._id, existingClient._id ?? id)
    ) {
      throw businessError(
        "Ce courriel est déjà utilisé par un autre client.",
        "EMAIL_ALREADY_USED",
      );
    }

    const updatedClient = await this.clientRepository.update(id, client);

    if (!updatedClient) {
      throw businessError("Client introuvable.", "CLIENT_NOT_FOUND");
    }

    return updatedClient;
  }

  async deleteClient(id) {
    const existingClient = await this.clientRepository.findById(id);

    if (!existingClient) {
      throw businessError("Client introuvable.", "CLIENT_NOT_FOUND");
    }

    await this.clientRepository.delete(id);
  }

  #createValidClient(data) {
    const client = new Client(data.name, data.email, data.phone);
    const validation = client.isValid();

    if (!validation.valid) {
      throw businessError(
        validation.errors.join(" "),
        "INVALID_CLIENT",
        validation.errors,
      );
    }

    return client;
  }
}
