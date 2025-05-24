/**
 * ReservationRepository.js
 * 
 * INTERFAZ REVELADA: Define el contrato para la persistencia del agregado Reservation
 * - Abstrae la infraestructura de persistencia del dominio
 * - Permite intercambiar implementaciones sin afectar al dominio
 */
class ReservationRepository {

    async findById(id) {
      throw new Error('Metodo no implementado');
    }
  
    async save(Reservation) {
      throw new Error('Metodo no implementado');
    }
  
    async fix(Reservation) {
      throw new Error('Metodo no implementado');
    }
  
    async delete(id) {
      throw new Error('Metodo no implementado');
    }
  
    async findAll() {
      throw new Error('Metodo no implementado');
    }

    async findInvalidReservations() {
        throw new Error('Metodo no implementado');
    }

    async findAliveReservations() {
        throw new Error('Metodo no implementado');
    }

  }
  
module.exports = ReservationRepository;