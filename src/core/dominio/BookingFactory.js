const Booking = require('./Booking'); 

/**
 * BookingFactory.js
 * 
 * FACTORÍA: Encapsula la creación de agregados Booking
 * - Oculta la complejidad de la instanciación
 * - Asegura que el agregado se crea en un estado válido
 */
class BookingFactory {
  
    // FUNCIÓN FACTORÍA: Crea una reserva estándar
    static createStandardBooking(id, space, usageType, maxAttendees, startTime, duration, additionalDetails, endTime, category) {
        return new Booking(id, space, usageType, maxAttendees, startTime, duration, additionalDetails, endTime, category);
    }
    
    // FUNCIÓN FACTORÍA: Crea una reserva a partir de datos existentes
    static createFromData(bookingData) {
        return new Booking(
            bookingData.id,
            bookingData.space,
            bookingData.usageType,
            bookingData.maxAttendees,
            bookingData.startTime,
            bookingData.duration,
            bookingData.additionalDetails,
            bookingData.category
        );
    }
}
  
module.exports = BookingFactory;