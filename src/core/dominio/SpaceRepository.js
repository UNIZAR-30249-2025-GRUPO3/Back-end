/**
 * SpaceRepository.js
 * 
 * INTERFAZ REVELADA: Define el contrato para la persistencia del agregado Space
 * - Abstrae la infraestructura de persistencia del dominio
 * - Permite intercambiar implementaciones sin afectar al dominio
 */
class SpaceRepository {

    async findById(id) {
      throw new Error('Método no implementado');
    }
  
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

    async findByFilters(criteria) {
      throw new Error('Método no implementado');
    }

    async findAvailableSpaces(dateTime, duration, minCapacity) {
      throw new Error('Método no implementado');
    }

    async findByFloor(floor) {
      throw new Error('Método no implementado');
    }

    async findByCategory(category) {
      throw new Error('Método no implementado');
    }

    async findByDepartment(department) {
      throw new Error('Método no implementado');
    }
}
  
module.exports = SpaceRepository;