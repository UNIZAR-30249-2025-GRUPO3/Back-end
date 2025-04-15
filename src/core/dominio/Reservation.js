/**
 * Reservation.js
 * 
 * ENTIDAD RAÍZ: Reservation es la entidad principal con identidad única (id)
 * AGREGADO: Reservation forma un agregado que encapsula la información de las reservas
 * - Mantiene la consistencia y las reglas de negocio del agregado
 * - Protege sus invariantes mediante validaciones internas
 */
class Reservation {
    constructor(id, space, usageType, maxAttendees, startTime, duration, additionalDetails, category = null) {
        
        // Validaciones que mantienen la integridad del agregado
        this.validateReservationInput(id, space, usageType, maxAttendees, startTime, duration, category);

        // Propiedades de la entidad raíz
        this.id = id; // Identificador único de la entidad
        this.space = space;
        this.usageType = usageType;
        this.maxAttendees = maxAttendees;
        this.startTime = startTime;
        this.duration = duration;
        this.additionalDetails = additionalDetails;
        this.endTime = new Date(this.startTime.getTime() + this.duration * 60000);
        if(category){
            this.category = category;
        }else{
            // Tipo del espacio
        }
    }

    // ASERCIÓN: Método que valida las invariantes básicas del agregado
    validateReservationInput(id, space, usageType, maxAttendees, startTime, duration, category) {

        if (!id) {
            throw new Error("ERROR: Falta asignar un identificador");
        }

        if (!space || !Array.isArray(space) || space.length === 0) {
            throw new Error("ERROR: Al menos un espacio debe ser seleccionado");
        }
        
        const allowedUsageTypes = ['docencia', 'investigacion', 'gestion', 'otro'];
        if (!usageType || !allowedUsageTypes.includes(usageType)) {
            throw new Error("ERROR: Tipo de uso inexistente o inválido.");
        }

        if (!maxAttendees || isNaN(maxAttendees) || maxAttendees <= 0) {
            throw new Error("ERROR: El número de asistentes máximos debe ser un número entero positivo");
        }
    
        if (!startTime || !(startTime instanceof Date) || isNaN(startTime.getTime())) {
            throw new Error("ERROR: Fecha de inicio inexistente o inválida.");
        }
    
        if (!duration || isNaN(duration) || duration <= 0) {
            throw new Error("ERROR: La duración debe ser un número entero positivo (en minutos).");
        }

        const allowedUsagecategories = ['aula', 'seminario', 'laboratorio', 'despacho', 'sala comun'];
        if (!category || !allowedUsagecategories.includes(category)) {
            throw new Error("ERROR: Categoría de reserva inválida.");
        }
      }

}

module.exports = Reservation;