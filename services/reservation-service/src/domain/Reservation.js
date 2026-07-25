/**
 * Représente une réservation de matériel effectuée par un client.
 *
 * Cette classe porte les données et calculs propres à une réservation. Elle
 * doit notamment interpréter correctement les dates et la quantité, vérifier
 * la cohérence de la période demandée et participer au calcul du montant de la
 * location à partir du prix quotidien fourni par le service du matériel.
 *
 * Travail demandé :
 * - déduire toutes les données d’une réservation à partir des besoins.
 * - normaliser les nombres et les dates lors de la création de l’objet.
 * - attribuer un état initial lorsqu’il n’est pas fourni.
 * - calculer la durée facturable de la location.
 * - calculer le total à partir de la durée, de la quantité et d’un prix.
 * - vérifier la validité de la réservation.
 *
 * Cette classe ne doit appeler aucun autre service et ne doit pas utiliser
 * directement MongoDB.
 */
export default class Reservation {
  /**
   * Crée une réservation à partir des identifiants du client et du matériel,
   * de la quantité et de la période demandées.
   *
   * clientName, equipmentName et totalPrice ne sont pas connus à la création :
   * ils seront renseignés par ReservationService une fois les informations
   * obtenues auprès des autres microservices.
   */
  constructor(clientId, equipmentId, quantity, startDate, endDate, status) {
    this.clientId = clientId;
    this.equipmentId = equipmentId;
    this.quantity = Number(quantity);
    this.startDate = new Date(startDate);
    this.endDate = new Date(endDate);
    this.status = status || "CONFIRMED";
    this.clientName = undefined;
    this.clientEmail = undefined;
    this.equipmentName = undefined;
    this.totalPrice = undefined;
  }

  /**
   * Vérifie la cohérence générale d'une réservation : identifiants présents,
   * quantité d'au moins un, dates valides et date de fin non antérieure à la
   * date de début.
   *
   * @returns {{ valid: boolean, errors: string[] }}
   */
  isValid() {
    const errors = [];

    if (!this.clientId) {
      errors.push("Le client est obligatoire.");
    }

    if (!this.equipmentId) {
      errors.push("Le matériel est obligatoire.");
    }

    if (!Number.isInteger(this.quantity) || this.quantity < 1) {
      errors.push("La quantité doit être un entier d'au moins un.");
    }

    if (Number.isNaN(this.startDate.getTime()) || Number.isNaN(this.endDate.getTime())) {
      errors.push("Les dates fournies sont invalides.");
    } else if (this.endDate < this.startDate) {
      errors.push("La date de fin ne peut pas précéder la date de début.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calcule la durée facturable, en incluant le premier et le dernier jour.
   */
  getDurationInDays() {
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.round((this.endDate - this.startDate) / millisecondsPerDay) + 1;
  }

  /**
   * Calcule et conserve le prix total à partir du prix quotidien fourni par
   * le service du matériel.
   */
  calculateTotal(dailyPrice) {
    this.totalPrice = this.getDurationInDays() * this.quantity * Number(dailyPrice);
    return this.totalPrice;
  }

  /**
   * Marque la réservation comme annulée.
   */
  cancel() {
    this.status = "CANCELLED";
  }
}
