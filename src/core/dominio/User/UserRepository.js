/**
 * UserRepository.js
 * 
 * INTERFAZ REVELADA: Define el contrato para la persistencia del agregado User
 * - Abstrae la infraestructura de persistencia del dominio
 * - Permite intercambiar implementaciones sin afectar al dominio
 */
class UserRepository {

    async findById(id) {
      throw new Error('Metodo no implementado');
    }
  
    async findByEmail(email) {
      throw new Error('Metodo no implementado');
    }
  
    async save(user) {
      throw new Error('Metodo no implementado');
    }
  
    async update(user) {
      throw new Error('Metodo no implementado');
    }
  
    async delete(id) {
      throw new Error('Metodo no implementado');
    }
  
    async findAll() {
      throw new Error('Metodo no implementado');
    }

  }
  
module.exports = UserRepository;