/**
 * SpaceType.js
 * 
 * OBJETO VALOR: Inmutable y que representa una propiedad sin identidad propia
 * - Preserva invariantes del concepto "tipo de espacio" en el dominio
 * - Este tipo es invariable en la aplicación
 */
class SpaceType {

    constructor(name) {
        // Validaciones que mantienen la integridad del objeto valor
        const validTypes = [
            "aula", "seminario", "laboratorio", "despacho", "sala común", "otro"
        ];

        // ASERCIONES: Validaciones que garantizan la integridad del valor
        if (!validTypes.includes(name)) {
            throw new Error(`Tipo de espacio inválido: ${name}`);
        }

        // Estado inmutable
        this.name = name;
    }

    // FUNCIÓN LIBRE DE ESTADOS SECUNDARIOS: Para comparación basada en valor
    equals(otherType) {
        return this.name === otherType.name;
    }

    // Retorna el valor como string
    toString() {
        return this.name;
    }
}

module.exports = SpaceType;