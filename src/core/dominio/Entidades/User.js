const Role = require('../ObjetosValor/Role');
const Department = require('../ObjetosValor/Department');

class User {

    constructor(id, name, email, password, role, department = null) {

      this.validateUserInput(id, name, email, password, role);

      this.id = id;
      this.name = name;
      this.email = email;
      this.password = password;
      this.role = new Role(role);
      if (department) {
        this.department = new Department(department);
      } else {
        this.department = null;
      }

      this.validateRoleDepartment();
    }

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