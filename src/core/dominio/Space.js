const SpaceType = require('./SpaceType');
const ReservationCategory = require('./ReservationCategory');
const AssignmentTarget = require('./AssignmentTarget');

/**
 * Space.js
 * 
 * ENTIDAD RAÍZ: Space es la entidad principal con identidad única (id)
 * AGREGADO: Space forma un agregado que encapsula SpaceType, ReservationCategory y AssignmentTarget
 * - Mantiene la consistencia y las reglas de negocio del agregado
 * - Protege sus invariantes mediante validaciones internas
 */
class Space {

    // ES PROBABLE QUE SEA NECESARIO VALIDAR EL CAMPO isReservable (tabla) *********************************************************

    constructor(id, name, floor, capacity, spaceType, isReservable, reservationCategory, 
                assignmentTarget, maxUsagePercentage, customSchedule) {
        
        // Validaciones que mantienen la integridad del agregado
        this.validateSpaceInput(id, name, floor, capacity, spaceType);

        // =======================
        // Propiedades invariables
        // =======================
        this.id = id;   // Identificador único de la entidad
        this.name = name;
        this.floor = floor;
        this.capacity = capacity;
        
        // OBJETO VALOR: Tipo de espacio (inmutable)
        this.spaceType = new SpaceType(spaceType);
        
        // =====================
        // Propiedades variables
        // =====================
        this.isReservable = isReservable;
        
        // OBJETO VALOR: Categoría de reserva (solo si es reservable)
        this.reservationCategory = isReservable ? new ReservationCategory(reservationCategory) : null;
        
        // OBJETO VALOR: Asignación
        this.assignmentTarget = new AssignmentTarget(assignmentTarget.type, assignmentTarget.targets);
        
        // Porcentaje máximo de uso (o null si usa el del edificio)
        this.maxUsagePercentage = maxUsagePercentage || null;
        
        // Horario personalizado (o null si usa el del edificio)
        this.customSchedule = customSchedule || null;

        // Validación adicional de consistencia interna del agregado
        this.validateSpaceConsistency();
    }

    // ASERCIÓN: Método que valida las invariantes básicas del agregado
    validateSpaceInput(id, name, floor, capacity, spaceType) {
        if (!id) {
            throw new Error("ERROR: Falta asignar un identificador");
        }

        if (!name || name.trim() === '') {
            throw new Error("El nombre del espacio es obligatorio.");
        }

        if (floor === undefined || floor === null) {
            throw new Error("La planta del espacio es obligatoria.");
        }

        if (!capacity || capacity <= 0) {
            throw new Error("La capacidad debe ser un número positivo.");
        }

        if (!spaceType) {
            throw new Error("El tipo de espacio es obligatorio.");
        }
    }

    // ASERCIÓN: Método que valida la consistencia entre el tipo de espacio y su configuración
    validateSpaceConsistency() {
        // Validar la coherencia entre tipo de espacio y categoría de reserva
        if (this.isReservable && !this.reservationCategory) {
            throw new Error("Si el espacio es reservable, debe tener una categoría de reserva.");
        }

        // Validar coherencia entre categoría de reserva y asignación
        // FALTA VERIFICAR LA CONSISTENCIA CON LOS ROLES DE LAS PERSONAS, PERO ESO NO SE PUEDE HACER AHÍ ****************************
        if (this.isReservable && this.reservationCategory) {
            const category = this.reservationCategory.name;
            const assignmentType = this.assignmentTarget.getType();

            if (category === "aula" || category === "sala común") {
                if (assignmentType !== "eina") {
                    throw new Error(`Un espacio con categoría ${category} debe estar asignado a la EINA.`);
                }
            } else if (category === "despacho") {
                if (assignmentType !== "person" && assignmentType !== "department") {
                    throw new Error("Un despacho debe estar asignado a una persona o departamento.");
                }
            } else if (category === "seminario" || category === "laboratorio") {
                if (assignmentType !== "department" && assignmentType !== "eina") {
                    throw new Error(`Un ${category} debe estar asignado a un departamento o a la EINA.`);
                }
            }
        }

        // Validar que si es despacho, no sea reservable
        if (this.reservationCategory && this.reservationCategory.name === "despacho") {
            throw new Error("Los despachos no pueden hacerse reservables.");
        }
    }
}

module.exports = Space;