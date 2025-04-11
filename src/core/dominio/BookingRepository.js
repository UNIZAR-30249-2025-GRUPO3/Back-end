/**
 * BookingRepository.js
 * 
 * INTERFAZ REVELADA: Define el contrato para la persistencia del agregado booking
 * - Abstrae la infraestructura de persistencia del dominio
 * - Permite intercambiar implementaciones sin afectar al dominio
 */
class BookingRepository {

    async findById(id) {
      throw new Error('Metodo no implementado');
    }
  
    async save(booking) {
      throw new Error('Metodo no implementado');
    }
  
    async fix(booking) {
      throw new Error('Metodo no implementado');
    }
  
    async delete(id) {
      throw new Error('Metodo no implementado');
    }
  
    async findAll() {
      throw new Error('Metodo no implementado');
    }

    async findInvalidBookings() {
        throw new Error('Metodo no implementado');
    }

    async findAliveBookings() {
        throw new Error('Metodo no implementado');
    }

  }
  
module.exports = BookingRepository;