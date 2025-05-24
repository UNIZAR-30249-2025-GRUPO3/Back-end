const Role = require('./Role');
const Department = require('./Department');

/**
 * User.js
 * 
 * ENTIDAD RAÍZ: User es la entidad principal con identidad única (id)
 * AGREGADO: User forma un agregado que encapsula Role y Department
 * - Mantiene la consistencia y las reglas de negocio del agregado
 * - Protege sus invariantes mediante validaciones internas
 */
class User {

    constructor(id, name, email, password, role, department = null) {

      // Validaciones que mantienen la integridad del agregado
      this.validateUserInput(id, name, email, password, role);

      // Propiedades de la entidad raíz
      this.id = id;   // Identificador único de la entidad
      this.name = name;
      this.email = email;
      this.password = password;

      // OBJETOS VALOR: Inmutables y sin identidad propia
      this.role = new Role(role);
      if (department) {
        this.department = new Department(department);
      } else {
        this.department = null;
      }

      // Validación adicional de consistencia interna del agregado
      this.validateRoleDepartment();
    }

    // ASERCIÓN: Método que valida las invariantes básicas del agregado
    validateUserInput(id, name, email, password, role) {

      if (!id) {
          throw new Error("ERROR: Falta asignar un identificador");
      }

      if (!name || name.trim() === '') {
          throw new Error("El nombre es obligatorio.");
      }

      //FALTA VERIFICAR LA VALIDEZ DEL EMAIL
      if (!email || email.trim() === '') {  
          throw new Error("El correo electrónico es obligatorio.");
      }

      if (!password || password.length < 8) {
          throw new Error("La contraseña es obligatoria y debe tener al menos 8 caracteres.");
      }

      if (!role) {
          throw new Error("Se debe proporcionar al menos un rol.");
      }
    }

    // ASERCIÓN: Método que valida la relación entre rol y departamento
    validateRoleDepartment() {
      const rolesWithoutDepartment = ["estudiante", "conserje", "gerente"];
  
      if (this.department) {
          const hasInvalidRole = this.role.roles.some(role => {
              if (role === "gerente") {
                  return !this.role.roles.includes("docente-investigador"); 
              }
              return rolesWithoutDepartment.includes(role);
          });
  
          if (hasInvalidRole) {
              throw new Error("El rol no permite estar adscrito a un departamento.");
          }
      }
  }
  
}
  
module.exports = User;