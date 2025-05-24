/**
 * Department.js
 * 
 * OBJETO VALOR: Inmutable y que representa una propiedad sin identidad propia
 * - Preserva invariantes del concepto "departamento" en el dominio
 */
class Department {

    constructor(name) {

        // Validaciones que mantienen la integridad del objeto valor
        const validDepartments = [
            "informática e ingeniería de sistemas",
            "ingeniería electrónica y comunicaciones"
        ];

        // ASERCIONES: Validaciones que garantizan la integridad del valor
        if (!validDepartments.includes(name)) {
            throw new Error(`Departamento inválido`);
        }

        // Estado inmutable
        this.name = name;
    }

    // FUNCIÓN LIBRE DE ESTADOS SECUNDARIOS: Para comparación basada en valor
    equals(otherDepartment) {
        return this.name === otherDepartment.name;
    }
}

module.exports = Department;
