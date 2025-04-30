const Space = require('./Space');

/**
 * SpaceFactory.js
 * 
 * FACTORÍA: Encapsula la creación de agregados Space
 * - Oculta la complejidad de la instanciación
 * - Asegura que el agregado se crea en un estado válido
 */
class SpaceFactory {
  
    // FUNCIÓN FACTORÍA: Crea un espacio estándar
    static createStandardSpace(id, name, floor, capacity, spaceType, isReservable, reservationCategory, 
                                assignmentTarget, maxUsagePercentage, customSchedule) {
        return new Space(
            id, name, floor, capacity, spaceType, isReservable, reservationCategory, 
            assignmentTarget, maxUsagePercentage, customSchedule
        );
    }
    
    // FUNCIÓN FACTORÍA: Crea un espacio a partir de datos existentes
    static createFromData(spaceData) {
        return new Space(
            spaceData.id,
            spaceData.name,
            spaceData.floor,
            spaceData.capacity,
            spaceData.spaceType,
            spaceData.isReservable,
            spaceData.reservationCategory,
            spaceData.assignmentTarget,
            spaceData.maxUsagePercentage,
            spaceData.customSchedule,
        );
    }
}

module.exports = SpaceFactory;