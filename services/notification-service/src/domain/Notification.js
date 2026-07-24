/**
 * Représente une notification produite par l’application.
 *
 * Une notification conserve les informations nécessaires pour savoir à qui
 * elle est destinée, quel message doit être communiqué et dans quel contexte
 * elle a été créée. Dans ce laboratoire, l’envoi est simulé par un
 * enregistrement dans MongoDB.
 *
 * Travail demandé :
 * - déterminer les données pertinentes d’une notification;
 * - fournir une valeur raisonnable lorsqu’une information optionnelle manque;
 * - vérifier qu’une notification contient le minimum nécessaire.
 *
 * Cette classe ne doit pas accéder à MongoDB et ne doit pas envoyer de courriel.
 */
export default class Notification {
  /**
   * Crée une notification à partir de son destinataire, de son message et de
   * son type. Le type est optionnel : une valeur générique est utilisée
   * lorsqu'il n'est pas fourni.
   */
  constructor(recipient, message, type) {
    this.recipient = typeof recipient === "string" ? recipient.trim() : "";
    this.message = typeof message === "string" ? message.trim() : "";
    this.type = typeof type === "string" && type.trim() ? type.trim() : "GENERAL";
  }

  /**
   * Vérifie qu'une notification contient le minimum nécessaire.
   *
   * @returns {{ valid: boolean, errors: string[] }}
   */
  isValid() {
    const errors = [];

    if (!this.recipient) {
      errors.push("Le destinataire est obligatoire.");
    }

    if (!this.message) {
      errors.push("Le message est obligatoire.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
