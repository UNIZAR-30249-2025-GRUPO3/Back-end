/**
 * ReservationCategory.js
 * 
 * OBJETO VALOR: Inmutable y que representa una propiedad sin identidad propia
 * - Preserva invariantes del concepto "categoría de reserva" en el dominio
 * - Permite cambios en la categoría de reserva de un espacio
 */
class ReservationCategory {

    constructor(name) {
        // Validaciones que mantienen la integridad del objeto valor
        const validCategories = [
            "aula", "seminario", "laboratorio", "despacho", "sala común"
        ];

        // ASERCIONES: Validaciones que garantizan la integridad del valor
        if (!validCategories.includes(name)) {
            throw new Error(`Categoría de reserva inválida: ${name}`);
        }

        // Estado inmutable
        this.name = name;
    }

    // FUNCIÓN LIBRE DE ESTADOS SECUNDARIOS: Para comparación basada en valor
    equals(otherCategory) {
        return this.name === otherCategory.name;
    }

    // Retorna el valor como string
    toString() {
        return this.name;
    }
}

module.exports = ReservationCategory;