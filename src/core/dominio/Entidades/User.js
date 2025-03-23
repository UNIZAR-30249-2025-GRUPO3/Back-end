class User {
    constructor(id, name, email, password, role, department = null) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.password = password;
      this.role = role;
      this.department = department;
    }
  
    // DEPARTAMENTOS Y ROLES SEGURAMENTE OBJETOS VALOR (ROL HAY CASOS DE DOS JUNTOS)

    // AQUI MÉTODOS PARA COMPROBACIONES??
  
}
  
module.exports = User;