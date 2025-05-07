/**
 * SpaceRepository.js
 * 
 * INTERFAZ REVELADA: Define el contrato para la persistencia del agregado Space
 * - Abstrae la infraestructura de persistencia del dominio
 * - Permite intercambiar implementaciones sin afectar al dominio
 */
class SpaceRepository {
  
    async save(space) {
      throw new Error('Método no implementado');
    }
  
    async update(space) {
      throw new Error('Método no implementado');
    }
  
    async delete(id) {
      throw new Error('Método no implementado');
    }
  
    async findAll(filters = {}) {
      throw new Error('Método no implementado');
    }

    async findById(id) {
      throw new Error('Método no implementado');
    }

    async findByFloor(floor) {
      throw new Error('Método no implementado');
    }

    async findByCategory(category) {
      throw new Error('Método no implementado');
    }

    async findByMinCapacity(minOccupants) {
      throw new Error('Método no implementado');
    }
}
  
module.exports = SpaceRepository;