const messageBroker = require('../../infraestructura/messageBroker');
const BD_UserRepository = require('../../infraestructura/Persistencia/BD_UserRepository');

class UserService {

  constructor() {
    this.userRepository = new BD_UserRepository();
    this.messageBroker = messageBroker; // Guarda la instancia
    this.setupConsumers().catch(err => {
        console.error('Error al iniciar consumidor:', err);
    });
  }
  
  async setupConsumers() {
    try {
        await this.messageBroker.connect();
        console.log('[RabbitMQ] Consumidor conectado'); 

        this.messageBroker.consume('user_operations',async (message, correlationId) => {
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


    async handleCreateUser(userData) {
      console.log('[DEBUG] Procesando creación de usuario:', userData.email);
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        return { error: 'El email ya está en uso' };
      }
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

    async handleGetUserById(userData) {
      if (!userData || !userData.id) {
          throw new Error('El campo "id" es requerido');
      }
  
      console.log(`[UserService] Buscando usuario con ID: ${userData.id}`);
  
      const user = await this.userRepository.findById(userData.id);
          
      if (!user) {
          console.warn(`[UserService] Usuario no encontrado (ID: ${userData.id})`);
          throw new Error('Usuario no encontrado');
      }
  
      console.log(`[UserService] Usuario encontrado: ${user.email}`);
      return user;
    }

    async handleGetAllUsers(userData) {
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

    async handleUpdateUser(userData) {
      
      if (!userData || !userData.id) {
        throw new Error('El campo "id" es requerido');
      }

      if (!userData.updateFields || Object.keys(userData.updateFields).length === 0) {
        throw new Error('Se requieren campos para actualizar');
      }

      console.log(`[UserService] Iniciando actualización para ID: ${userData.id}`);
      console.log('[DEBUG] Campos a actualizar:', userData.updateFields);
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

      const updatedUser = {
        id: user.id,
        name: userData.name || user.name,
        email: userData.email || user.email,
        password: userData.password || user.password,
        role: userData.role || user.role,
        department: userData.department || user.department
      }


      console.log(`[UserService] Usuario actualizado: ${updatedUser.email}`);
      console.log('[DEBUG] Datos finales:', {
          _id: updatedUser.id,
          email: updatedUser.email,
          changes: userData.updateFields
      });

      return updatedUser;
    }

  async handleDeleteUser(userData) {
 
    if (!userData || !userData.id) {
        throw new Error('El campo "id" es requerido');
    }

    console.log(`[UserService] Iniciando eliminación para ID: ${userData.id}`);

    const user = await this.userRepository.findById(userData.id);
      if (!user) {
        console.warn(`[UserService] Usuario no encontrado (ID: ${userData.id})`);
        throw new Error('Usuario no encontrado');
      }

    const deletionResult = await this.userRepository.delete(userData.id);

    console.log(`[UserService] Usuario eliminado: ${user.email} (ID: ${userData.id})`);
        
    return {
        id: userData.id,
        email: user.email,
        deletedAt: new Date().toISOString()
    };
  }

}
  
module.exports = UserService;