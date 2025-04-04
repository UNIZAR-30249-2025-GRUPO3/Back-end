const UserRepository = require('../../dominio/Repositorios/UserRepository');
const User = require('../../dominio/Entidades/User');

class PostgresUserRepository extends UserRepository {

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
        const newUser = new User(
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

        const updatedUser  = new User(
            user.id,
            user.name,
            user.email,
            user.password,
            user.role,
            user.department
        );

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

module.exports = PostgresUserRepository;