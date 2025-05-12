const ReservationCategory = require("./ReservationCategory");

/**
 * Reservation.js
 * 
 * ENTIDAD RAÍZ: Reservation es la entidad principal con identidad única (id)
 * AGREGADO: Reservation forma un agregado que encapsula la información de las reservas
 * - Mantiene la consistencia y las reglas de negocio del agregado
 * - Protege sus invariantes mediante validaciones internas
 */
class Reservation {
    constructor(id, userId, spaceIds, usageType, maxAttendees, startTime, duration, additionalDetails, category = null, status = 'valid') {
        
        // Validaciones que mantienen la integridad del agregado
        this.validateReservationInput(id, userId, spaceIds, usageType, maxAttendees, startTime, duration);

        // Propiedades de la entidad raíz

        this.id = id; // Identificador único de la entidad
        this.userId = userId;
        this.spaceIds = spaceIds;
        this.usageType = usageType;
        this.maxAttendees = maxAttendees;
        this.startTime = new Date(startTime);
        this.duration = duration;
        this.additionalDetails = additionalDetails;
        this.endTime = new Date(this.startTime.getTime() + this.duration * 60000);
        console.log("Categoría recibida:", category, typeof category);
        this.category = new ReservationCategory(category);
        this.status = status;
    }

    // ASERCIÓN: Método que valida las invariantes básicas del agregado
    validateReservationInput(id, userId, spaceIds, usageType, maxAttendees, startTime, duration) {

        if (!id) {
            throw new Error("ERROR: Falta asignar un identificador");
        }

        if (!userId) {
            throw new Error("ERROR: Falta asignar un identificador de usuario");
        }

        if (!spaceIds || !Array.isArray(spaceIds) || spaceIds.length === 0){
            throw new Error("ERROR: Al menos un espacio debe ser seleccionado");
        }
        
        const allowedUsageTypes = ['docencia', 'investigacion', 'gestion', 'otro'];
        if (!usageType || !allowedUsageTypes.includes(usageType)) {
            throw new Error("ERROR: Tipo de uso inexistente o inválido.");
        }

        if (!maxAttendees || isNaN(maxAttendees) || maxAttendees <= 0) {
            throw new Error("ERROR: El número de asistentes máximos debe ser un número entero positivo");
        }
    
        const start = new Date(startTime);
        if (!startTime || isNaN(start.getTime())) {
          throw new Error("ERROR: Fecha de inicio inexistente o inválida.");
        }
    
        if (!duration || isNaN(duration) || duration <= 0) {
            throw new Error("ERROR: La duración debe ser un número entero positivo (en minutos).");
        }
      }

}

module.exports = Reservation;