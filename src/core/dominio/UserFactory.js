const User = require('./User'); 

/**
 * UserFactory - Fábrica para la creación de agregados User
 * Encapsula la lógica de creación y validación inicial
 */
class UserFactory {
  
    static createStandardUser(id, name, email, password, role, department) {
        return new User(id, name, email, password, role, department);
    }
    
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