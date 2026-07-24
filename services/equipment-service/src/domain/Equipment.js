/**
 * Représente un matériel disponible à la location.
 *
 * Cette classe doit regrouper les informations commerciales et de stock d’un
 * article loué par Eventia Location. Elle porte aussi les règles permettant
 * de vérifier la cohérence d’un matériel et de déterminer si une quantité
 * demandée peut être réservée.
 *
 * Travail demandé :
 * - déduire les données nécessaires à partir du dialogue et des contrats REST;
 * - convertir les valeurs numériques lorsque cela est nécessaire;
 * - vérifier la validité générale d’un matériel;
 * - vérifier si le stock permet une réservation donnée.
 *
 * Ne placez ici aucune logique MongoDB, Express ou Axios.
 */
export default class Equipment {
  /**
   * Crée un matériel à partir de ses caractéristiques commerciales et de stock.
   *
   * Les valeurs numériques sont converties ici afin que l'entité manipule
   * toujours des nombres, peu importe leur provenance (formulaire, API, etc.).
   */
  constructor(name, category, dailyPrice, availableQuantity) {
    this.name = typeof name === "string" ? name.trim() : "";
    this.category = typeof category === "string" ? category.trim() : "";
    this.dailyPrice = Number(dailyPrice);
    this.availableQuantity = Number(availableQuantity);
  }

  /**
   * Vérifie les règles simples propres à un matériel.
   *
   * @returns {{ valid: boolean, errors: string[] }}
   */
  isValid() {
    const errors = [];

    if (!this.name) {
      errors.push("Le nom est obligatoire.");
    }

    if (!this.category) {
      errors.push("La catégorie est obligatoire.");
    }

    if (!Number.isFinite(this.dailyPrice) || this.dailyPrice < 0) {
      errors.push("Le prix quotidien doit être un nombre positif.");
    }

    if (!Number.isInteger(this.availableQuantity) || this.availableQuantity < 0) {
      errors.push("La quantité disponible doit être un entier positif ou nul.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Indique si la quantité demandée peut être prélevée du stock actuel.
   */
  canReserve(quantity) {
    const requested = Number(quantity);
    return Number.isInteger(requested) && requested > 0 && requested <= this.availableQuantity;
  }
}
