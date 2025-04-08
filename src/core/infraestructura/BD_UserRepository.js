const UserRepository = require('../dominio/UserRepository');
const UserFactory = require('../dominio/UserFactory');

/**
 * BD_UserRepository.js
 * 
 * IMPLEMENTACIÓN CONCRETA DEL REPOSITORIO: 
 * - Implementa la interfaz del repositorio
 * - Pertenece a la capa de infraestructura
 * - Se encarga de la persistencia real del agregado
 */
class BD_UserRepository extends UserRepository {

    // DEMOMENTO LA PERSISNTENCIA SE HACE EN MEMORIA PARA PRUEBAS - LUEGO PASAR A BD

    constructor() {
        super();
        this.users = new Map();
        this.nextId = 1;
    }
    
    async findById(id) {
        return this.users.get(Number(id)) || null;
    }
      
    
    async findByEmail(email) {
        return [...this.users.values()].find(user => user.email === email) || null;
    }
    
    async save(user) {
        const id = this.nextId;
        const newUser = UserFactory.createStandardUser(
            id,
            user.name,
            user.email,
            user.password,
            user.role,
            user.department
        );
        
        this.users.set(id, newUser);
        this.nextId++; 

        return newUser;
    }
    
    async update(user) {
        if (!this.users.has(user.id)) {
          throw new Error('Usuario no encontrado');
        }

        const updatedUser = UserFactory.createFromData(user);

        this.users.set(updatedUser.id, updatedUser);
        return user;
    }
    
    async delete(id) {
        this.users.delete(Number(id));
    }
    
    async findAll() {
        return [...this.users.values()];
    }
}

module.exports = BD_UserRepository;