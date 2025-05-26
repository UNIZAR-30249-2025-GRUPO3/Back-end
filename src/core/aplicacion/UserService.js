const messageBroker = require('../infraestructura/messageBroker');
const BD_UserRepository = require('../infraestructura/BD_UserRepository');
const UserFactory = require('../dominio/User/UserFactory');
const ReservationService = require('./ReservationService');

/**
 * UserService.js
 * 
 * SERVICIO DE APLICACIÓN: 
 * - Implementa casos de uso específicos para el usuario
 * - Coordina el flujo de datos entre el dominio y la infraestructura
 */
class UserService {

  constructor({ initializeConsumer = true } = {})  {
    // Dependencias de infraestructura
    this.userRepository = new BD_UserRepository();
    this.messageBroker = messageBroker; // Guarda la instancia
    this.reservationService = null;

    if (initializeConsumer) {
      // Inicialización de consumidores de mensajes
      this.setupConsumers().catch(err => {
        console.error('Error al iniciar consumidor:', err);
      });
    }
  }

  init({reservationService }) {
      this.reservationService = reservationService;
  }

  // SERVICIO DISTRIBUIDO: Configuración para comunicación asíncrona
  async setupConsumers() {
    try {
      await this.messageBroker.connect();
      console.log('[RabbitMQ] Consumidor de usuario conectado');

      this.messageBroker.consume('user_operations', async (message, correlationId) => {
        if (!message || !message.operation) {
          console.error('[UserService] Mensaje malformado:', message);
          return;
        }
        try {
          console.log('[DEBUG] Mensaje recibido:', message);
          let user;
          switch (message.operation) {
            case 'createUser':
              user = await this.handleCreateUser(message.data);
              break;
            case 'getUserById':
              user = await this.handleGetUserById(message.data);
              break;
            case 'updateUser':
              user = await this.handleUpdateUser(message.data);
              break;
            case 'deleteUser':
              user = await this.handleDeleteUser(message.data);
              break;
            case 'getAllUsers':
              user = await this.handleGetAllUsers(message.data);
              break;
            case 'login':
              user = await this.handleLogin(message.data);
              break;
            default:
              break;
          }

          await messageBroker.sendResponse(user, correlationId, message.replyTo);
        } catch (error) {
          console.error('Error procesando mensaje:', error);
          const errorResponse = { success: false, error: error.message };
          await messageBroker.sendResponse(errorResponse, correlationId, message.replyTo);
        }
      });
    } catch (error) {
      console.error('Error en setupConsumers:', error);
    }
  }

  // ================================================
  // Métodos de servicio que implementan casos de uso
  // ================================================

  // ==========================
  // CASO DE USO: Crear usuario
  // ==========================
  async handleCreateUser(userData) {

    // Verifica precondiciones del caso de uso
    console.log('[DEBUG] Procesando creación de usuario:', userData.email);
    const existingUser = await this.userRepository.findByEmail(userData.email);

    if (existingUser) {
      return { error: 'El email ya está en uso' };
    }

    // Validación del dominio mediante factoría
    try {
      UserFactory.createStandardUser(
        "temp",
        userData.name,
        userData.email,
        userData.password,
        userData.role,
        userData.department
      );
    } catch (error) {
      throw new Error(error.message);
    }

    // Persistencia mediante repositorio
    const user = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      department: userData.department
    };
    const savedUser = await this.userRepository.save(user);
    console.log('[DEBUG] Usuario guardado:', savedUser);
    return savedUser;
  }

  // ===================================
  // CASO DE USO: Obtener usuario por id
  // ===================================
  async handleGetUserById(userData) {

    // Verifica precondiciones del caso de uso
    if (!userData || !userData.id) {
      throw new Error('El campo "id" es requerido');
    }

    console.log(`[UserService] Buscando usuario con ID: ${userData.id}`);

    // Validación de existencia
    const user = await this.userRepository.findById(userData.id);

    if (!user) {
      console.warn(`[UserService] Usuario no encontrado (ID: ${userData.id})`);
      throw new Error('Usuario no encontrado');
    }

    console.log(`[UserService] Usuario encontrado: ${user.email}`);
    return user;
  }

  // CASO DE USO: Obtener todos los usuarios
  async handleGetAllUsers(userData) {

    // Consulta al repositorio
    console.log('[UserService] Obteniendo todos los usuarios');
    const users = await this.userRepository.findAll(userData?.filters || {});
    console.log(`[UserService] Usuarios encontrados: ${users.length}`);

    users.forEach((user, index) => {
      console.log(`\n[User ${index + 1}]`);
      console.log('ID:', user._id || user.id);
      console.log('Nombre:', user.name);
      console.log('Email:', user.email);
      console.log('Rol:', user.role);
    });

    return users;
  }

  // ===============================
  // CASO DE USO: Actualizar usuario
  // ===============================
  async handleUpdateUser(userData) {

    // Verifica precondiciones del caso de uso
    if (!userData || !userData.id) {
      throw new Error('El campo "id" es requerido');
    }
  
    if (!userData.updateFields || Object.keys(userData.updateFields).length === 0) {
      throw new Error('Se requieren campos para actualizar');
    }
  
    console.log(`[UserService] Iniciando actualización para ID: ${userData.id}`);
    console.log('[DEBUG] Campos a actualizar:', userData.updateFields);
    
    // Validación de existencia
    const user = await this.userRepository.findById(userData.id);
  
    if (!user) {
      console.warn(`[UserService] Usuario no encontrado (ID: ${userData.id})`);
      throw new Error('Usuario no encontrado');
    }
  
    if (userData.updateFields.email && userData.updateFields.email !== user.email) {
      const emailExists = await this.userRepository.findByEmail(userData.updateFields.email);
      if (emailExists) {
        throw new Error('El email ya está en uso');
      }
    }
  
    // Preservación del estado
    const userObj = user.toObject ? user.toObject() : user;
    
    const currentRoles = userObj.role && userObj.role.roles ? userObj.role.roles : [];
    
    const updatedData = {
      ...userObj,
      ...userData.updateFields,
      updatedAt: new Date(),
    };
  
    if ("department" in userData.updateFields) {
      updatedData.department = userData.updateFields.department; 
    } else {
      updatedData.department = userObj.department ? userObj.department.name : null;
    }
    
    let rolesToUse;

    if (userData.updateFields.role) {
        if (Array.isArray(userData.updateFields.role)) {
            rolesToUse = userData.updateFields.role;
        } 
        else if (userData.updateFields.role.roles) {
            rolesToUse = Array.isArray(userData.updateFields.role.roles) 
                      ? userData.updateFields.role.roles 
                      : [userData.updateFields.role.roles];
        }
        else {
            rolesToUse = [userData.updateFields.role];
        }
    } else {
        rolesToUse = currentRoles;
    }

    updatedData.role = rolesToUse;
    console.log('Roles:', rolesToUse);
    
    // Validación del dominio mediante factoría
    try {
      UserFactory.createFromData({
        id: userData.id, 
        name: updatedData.name,
        email: updatedData.email,
        password: updatedData.password,
        role: rolesToUse, 
        department: updatedData.department
      });
    } catch (error) {
      throw new Error(error.message);
    }
  
    // Persistencia mediante repositorio
    const updatedUser = await this.userRepository.update(updatedData);
  
    console.log(`[UserService] Usuario actualizado: ${updatedUser.email}`);
    console.log('[DEBUG] Datos finales:', {
      _id: updatedUser.id,
      email: updatedUser.email,
      changes: userData.updateFields
    });
  
    const reservations = await this.reservationService.handleGetReservationsByUser({ userId: updatedUser.id });
    for (const reservation of reservations) {
      const { id: reservationId, spaceIds, startTime, duration } = reservation;

      for (const spaceId of spaceIds) {
        try {
          await this.reservationService.validateUserCanReserveSpace(updatedUser.id, spaceId, startTime, duration);
        } catch (err) {
          console.warn(`[UserService] Reserva ${reservationId} no válida para el espacio ${spaceId}: ${err.message}`);
          await this.reservationService.handleInvalidReservation({ id: reservationId });
          break;
        }
      }
    }
  
    return updatedUser;
  }

  // =============================
  // CASO DE USO: Eliminar usuario
  // =============================
  async handleDeleteUser(userData) {

    // Verifica precondiciones del caso de uso
    if (!userData || !userData.id) {
      throw new Error('El campo "id" es requerido');
    }

    console.log(`[UserService] Iniciando eliminación para ID: ${userData.id}`);

    // Validación de existencia
    const user = await this.userRepository.findById(userData.id);
    if (!user) {
      console.warn(`[UserService] Usuario no encontrado (ID: ${userData.id})`);
      throw new Error('Usuario no encontrado');
    }

    // Elminación mediante el repositorio
    const deletionResult = await this.userRepository.delete(userData.id);

    console.log(`[UserService] Usuario eliminado: ${user.email} (ID: ${userData.id})`);

    // Confirmación de eliminación
    return {
      id: userData.id,
      email: user.email,
      deletedAt: new Date().toISOString()
    };
  }

  // =====================================
  // CASO DE USO: Autenticación de usuario
  // =====================================
  async handleLogin(loginData) {
    const { email, password } = loginData;

    console.log('[UserService] Buscando usuario con email:', email);

    // Validación de existencia
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Validación de autenticación
    //const passwordMatch = await bcrypt.compare(password, user.password); util si encriptamos mas adelante
    if (user.password !== password) { // Passwordmatch si encriptamos
      throw new Error('Contraseña incorrecta');
    }

    console.log('[UserService] Usuario autenticado:', user.id);

    return {
      id: user.id,
      role: user.role
    };
  }
}

module.exports = UserService;