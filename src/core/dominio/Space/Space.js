const SpaceType = require('./SpaceType');
const ReservationCategory = require('../Reservation/ReservationCategory');
const AssignmentTarget = require('./AssignmentTarget');

const validReservationCategoriesPerSpaceType = {
    'aula': ['aula', 'seminario', 'laboratorio', 'sala común'],
    'seminario': ['aula', 'seminario', 'laboratorio', 'sala común'],
    'laboratorio': ['aula', 'laboratorio'],
    'despacho': ['despacho'],
    'sala común': ['aula', 'seminario', 'sala común'],
};

/**
 * Space.js
 * 
 * ENTIDAD RAÍZ: Space es la entidad principal con identidad única (id)
 * AGREGADO: Space forma un agregado que encapsula SpaceType, ReservationCategory y AssignmentTarget
 * - Mantiene la consistencia y las reglas de negocio del agregado
 * - Protege sus invariantes mediante validaciones internas
 */
class Space {

    constructor(id, name, floor, capacity, spaceType, isReservable, reservationCategory, 
                assignmentTarget, maxUsagePercentage, customSchedule, idSpace) {
        
        // Validaciones que mantienen la integridad del agregado
        this.validateSpaceInput(id, name, floor, capacity, spaceType, idSpace, maxUsagePercentage);

        // =======================
        // Propiedades invariables
        // =======================
        this.id = id;   // Identificador único de la entidad
        this.idSpace = idSpace;
        this.name = name;
        this.floor = floor;
        this.capacity = capacity;
        
        // OBJETO VALOR: Tipo de espacio (inmutable)
        this.spaceType = new SpaceType(spaceType);
        
        // =====================
        // Propiedades variables
        // =====================
        this.isReservable = isReservable;
        
        // OBJETO VALOR: Categoría de reserva
        this.reservationCategory = reservationCategory ? new ReservationCategory(reservationCategory) : null;
        
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
    validateSpaceInput(id, name, floor, capacity, spaceType, idSpace, maxUsagePercentage) {
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

        if (!idSpace) {
            throw new Error("El id real del espacio es obligatorio.");
        }

        // Validación del porcentaje máximo de uso
        if (maxUsagePercentage !== null && maxUsagePercentage !== undefined) {
            if (typeof maxUsagePercentage !== 'number' || isNaN(maxUsagePercentage)) {
                throw new Error("El porcentaje máximo de uso debe ser un número.");
            }
            
            if (maxUsagePercentage < 0 || maxUsagePercentage > 100) {
                throw new Error("El porcentaje máximo de uso debe estar entre 0 y 100.");
            }
        }
    }

    // ASERCIÓN: Método que valida la consistencia entre el tipo de espacio y su configuración
    validateSpaceConsistency() {
        // Validar la coherencia entre tipo de espacio y categoría de reserva
        if (this.isReservable && !this.reservationCategory) {
            throw new Error("Si el espacio es reservable, debe tener una categoría de reserva.");
        }

        // Validar coherencia entre categoría de reserva y asignación (la validación de los roles se hace en el servicio)
        if (this.reservationCategory) {
            const category = this.reservationCategory.name;
            const spaceType = this.spaceType.name;
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
                    throw new Error(`Un espacio con categoría ${category} debe estar asignado a un departamento o a la EINA.`);
                }
            }
        }

        // Validar que si es despacho, no sea reservable
        if (this.spaceType.name === "despacho" && this.isReservable) {
            throw new Error("Los despachos no pueden hacerse reservables.");
        }

        // Validar que el tipo de espacio permita la categoría de reserva
        if (this.reservationCategory) {
            const spaceTypeName = this.spaceType.name;
            const reservationCategoryName = this.reservationCategory.name;

            const allowedCategories = validReservationCategoriesPerSpaceType[spaceTypeName];

            if (!allowedCategories || !allowedCategories.includes(reservationCategoryName)) {
                throw new Error(
                    `No se permite asignar la categoría de reserva '${reservationCategoryName}' al tipo de espacio '${spaceTypeName}'.`
                );
            }
        }
    }
}

module.exports = Space;