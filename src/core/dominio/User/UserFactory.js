const User = require('./User'); 

/**
 * UserFactory.js
 * 
 * FACTORÍA: Encapsula la creación de agregados User
 * - Oculta la complejidad de la instanciación
 * - Asegura que el agregado se crea en un estado válido
 */
class UserFactory {
  
    // FUNCIÓN FACTORÍA: Crea un usuario estándar
    static createStandardUser(id, name, email, password, role, department) {
        return new User(id, name, email, password, role, department);
    }
    
    // FUNCIÓN FACTORÍA: Crea un usuario a partir de datos existentes
    static createFromData(userData) {
        return new User(
            userData.id,
            userData.name,
            userData.email,
            userData.password,
            userData.role,
            userData.department
        );
    }
}
  
module.exports = UserFactory;