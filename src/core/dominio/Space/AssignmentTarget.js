/**
 * AssignmentTarget.js
 * 
 * OBJETO VALOR: Inmutable y que representa a quién está asignado un espacio
 * - Puede ser EINA, un departamento o una/varias personas
 * - Preserva invariantes del concepto "asignación" en el dominio
 */
class AssignmentTarget {

    constructor(type, targets) {
        // Validaciones que mantienen la integridad del objeto valor
        const validTypes = ["eina", "department", "person"];

        // ASERCIONES: Validaciones que garantizan la integridad del valor
        if (!validTypes.includes(type)) {
            throw new Error(`Tipo de asignación inválido: ${type}`);
        }

        // Validar targets según el tipo
        if (type === "eina") {
            if (targets && targets.length > 0) {
                throw new Error("Cuando el tipo es 'eina', no debe especificarse targets");
            }
            this.targets = [];
        } else if (type === "department") {
            if (!targets || targets.length !== 1) {
                throw new Error("Para tipo 'department', se debe especificar exactamente un departamento");
            }
            
            const validDepartments = [
                "informática e ingeniería de sistemas",
                "ingeniería electrónica y comunicaciones"
            ];
            
            if (!validDepartments.includes(targets[0])) {
                throw new Error(`Departamento inválido: ${targets[0]}`);
            }
            
            this.targets = [...targets];
        } else if (type === "person") {
            if (!targets || targets.length === 0) {
                throw new Error("Para tipo 'person', se debe especificar al menos una persona");
            }
            this.targets = [...targets]; // IDs de personas
        }

        // Estado inmutable
        this.type = type;
    }

    // FUNCIÓN LIBRE DE ESTADOS SECUNDARIOS: Para comparación basada en valor
    equals(otherAssignment) {
        if (this.type !== otherAssignment.type) {
            return false;
        }
        
        if (this.targets.length !== otherAssignment.targets.length) {
            return false;
        }
        
        return this.targets.every(target => otherAssignment.targets.includes(target));
    }

    // Retorna el tipo de asignación
    getType() {
        return this.type;
    }

    // Retorna los targets
    getTargets() {
        return [...this.targets];
    }
}

module.exports = AssignmentTarget;