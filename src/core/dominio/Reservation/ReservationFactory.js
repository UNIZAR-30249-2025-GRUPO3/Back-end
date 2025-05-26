const Reservation = require('./Reservation'); 

/**
 * ReservationFactory.js
 * 
 * FACTORÍA: Encapsula la creación de agregados Reservation
 * - Oculta la complejidad de la instanciación
 * - Asegura que el agregado se crea en un estado válido
 */
class ReservationFactory {
  
    // FUNCIÓN FACTORÍA: Crea una reserva estándar
    static createStandardReservation(id, userId, spaceIds, usageType, maxAttendees, startTime, duration, additionalDetails) {
        return new Reservation(id, userId, spaceIds, usageType, maxAttendees, startTime, duration, additionalDetails);
    }
    
    // FUNCIÓN FACTORÍA: Crea una reserva a partir de datos existentes
    static createFromData(ReservationData) {
        return new Reservation(
            ReservationData.id,
            ReservationData.userId,
            ReservationData.spaceIds,
            ReservationData.usageType,
            ReservationData.maxAttendees,
            ReservationData.startTime,
            ReservationData.duration,
            ReservationData.additionalDetails,
            ReservationData.status,
            ReservationData.invalidatedat
        );
    }
}
  
module.exports = ReservationFactory;