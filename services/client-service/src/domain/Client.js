/**
 * Représente un client de l’entreprise Eventia Location.
 *
 * Cette classe doit regrouper les informations nécessaires pour identifier
 * et contacter un client. Elle doit aussi contenir les règles simples qui
 * permettent de vérifier qu’un client possède des données acceptables avant
 * son enregistrement.
 *
 * Travail demandé :
 * - déterminer les données qui décrivent un client à partir des besoins.
 * - initialiser correctement un nouvel objet client.
 * - prévoir une opération permettant de vérifier sa validité.
 *
 * Ne placez ici aucune logique liée à MongoDB ou aux requêtes HTTP.
 */
export default class Client {
  /**
   * Crée un client à partir de ses coordonnées.
   *
   * Les valeurs sont normalisées ici afin que l'entité conserve toujours des
   * chaînes propres, indépendamment de la provenance des données (formulaire,
   * API, etc.).
   */
  constructor(name, email, phone) {
    this.name = typeof name === "string" ? name.trim() : "";
    this.email = typeof email === "string" ? email.trim().toLowerCase() : "";
    this.phone = typeof phone === "string" ? phone.trim() : "";
  }

  /**
   * Vérifie les règles simples propres à un client.
   *
   * L'unicité du courriel dépend des clients déjà enregistrés et doit donc
   * être vérifiée par ClientService à l'aide de ClientRepository.
   *
   * @returns {{ valid: boolean, errors: string[] }}
   */
  isValid() {
    const errors = [];

    if (!this.name) {
      errors.push("Le nom est obligatoire.");
    }

    if (!this.email) {
      errors.push("Le courriel est obligatoire.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push("Le courriel est invalide.");
    }

    if (!this.phone) {
      errors.push("Le téléphone est obligatoire.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
