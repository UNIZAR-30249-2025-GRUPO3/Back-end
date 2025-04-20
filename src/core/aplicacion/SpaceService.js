const messageBroker = require('../infraestructura/messageBroker');
const BD_SpaceRepository = require('../infraestructura/BD_SpaceRepository');
const BuildingService = require('./BuildingService');
const UserService = require('./UserService');
const SpaceFactory = require('../dominio/SpaceFactory');

/**
 * SpaceService.js
 * 
 * SERVICIO DE APLICACIÓN: 
 * - Implementa casos de uso específicos para los espacios
 * - Coordina el flujo de datos entre el dominio y la infraestructura
 */
class SpaceService {

  constructor() {
    // Dependencias de infraestructura
    this.spaceRepository = new BD_SpaceRepository();
    this.buildingService = new BuildingService({ initializeConsumer: false });
    this.userService = new UserService({ initializeConsumer: false });

    this.messageBroker = messageBroker; // Guarda la instancia
    
    // Inicialización de consumidores de mensajes
    this.setupConsumers().catch(err => {
      console.error('Error al iniciar consumidor:', err);
    });
  }

  // SERVICIO DISTRIBUIDO: Configuración para comunicación asíncrona
  async setupConsumers() {
    try {
      await this.messageBroker.connect();
      console.log('[RabbitMQ] Consumidor de espacios conectado');

      this.messageBroker.consume('space_operations', async (message, correlationId) => {
        if (!message || !message.operation) {
          console.error('[SpaceService] Mensaje malformado:', message);
          return;
        }
        try {
          console.log('[DEBUG] Mensaje recibido:', message);
          let result;
          switch (message.operation) {
            case 'createSpace':
              result = await this.handleCreateSpace(message.data);
              break;
            case 'getSpaceById':
              result = await this.handleGetSpaceById(message.data);
              break;
            case 'updateSpace':
              result = await this.handleUpdateSpace(message.data);
              break;
            case 'deleteSpace':
              result = await this.handleDeleteSpace(message.data);
              break;
            case 'getAllSpaces':
              result = await this.handleGetAllSpaces(message.data);
              break;
            case 'findSpacesByFloor':
              result = await this.handleFindSpacesByFloor(message.data);
              break;
            case 'findSpacesByCategory':
              result = await this.handleFindSpacesByCategory(message.data);
              break;
            case 'findSpacesByDepartment':
              result = await this.handleFindSpacesByDepartment(message.data);
              break;
            default:
              throw new Error(`Operación no soportada: ${message.operation}`);
          }

          await messageBroker.sendResponse(result, correlationId, message.replyTo);
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

  //Método para valida que los usuarios asignados al espacio tengan roles permitidos
  async validateUserAssignment(assignmentTarget) {

    // Solo se valida si el tipo de asignación es a personas
    if (assignmentTarget.type !== 'person') {
      return true;
    }

    const targets = assignmentTarget.targets || [];
    
    // Para cada ID de usuario en la asignación
    for (const userId of targets) {
      try {
        // Obtener información del usuario directamente del servicio
        const user = await this.userService.handleGetUserById({ id: userId });
        
        if (!user || !user.role) {
          console.warn(`[SpaceService] Usuario no encontrado o sin rol (ID: ${userId})`);
          return false;
        }
        
        // Se verifica que el usuario tenga uno de los roles permitidos para asignación de espacios
        const allowedRoles = ['investigador contratado', 'docente-investigador'];
        const userRole = typeof user.role === 'string' ? user.role : 
                        (user.role.roles ? user.role.roles[0] : null);
        
        if (!allowedRoles.includes(userRole)) {
          console.warn(`[SpaceService] Rol no permitido para asignación de espacios: ${userRole}`);
          return false;
        }
      } catch (error) {
        console.error(`[ERROR] Error al validar usuario ${userId}:`, error);
        return false;
      }
    }
    
    return true;
  }

  // ================================================
  // Métodos de servicio que implementan casos de uso
  // ================================================

  // ==========================
  // CASO DE USO: Crear espacio
  // ==========================
  async handleCreateSpace(spaceData) {

    console.log('[DEBUG] Procesando creación de espacio:', spaceData.name);

    try {
      // Obtener valores del edificio si son nulos
      if (spaceData.maxUsagePercentage === null) {
        const buildingInfo = await this.buildingService.handleGetOccupancyPercentage();
        spaceData.maxUsagePercentage = buildingInfo.occupancyPercentage;
      }
      
      if (spaceData.customSchedule === null) {
        const buildingHours = await this.buildingService.handleGetOpeningHours();
        spaceData.customSchedule = buildingHours.openingHours;
      }

      // Se valida la asignación de usuarios si el tipo es 'person'
      if (spaceData.assignmentTarget && spaceData.assignmentTarget.type === 'person') {
        const isValidAssignment = await this.validateUserAssignment(spaceData.assignmentTarget);
        if (!isValidAssignment) {
          throw new Error('La asignación de usuarios no es válida. Solo se puede asignar espacios a investigadores contratados o docentes-investigadores.');
        }
      }

      // Validación del dominio mediante factoría
      try {
        SpaceFactory.createStandardSpace(
            "temp",
            spaceData.name,
            spaceData.floor,
            spaceData.capacity,
            spaceData.spaceType,
            spaceData.isReservable,
            spaceData.reservationCategory,
            spaceData.assignmentTarget,
            spaceData.maxUsagePercentage,
            spaceData.customSchedule
        );
      } catch (error) {
            throw new Error(error.message);
      }
  
      // Persistencia mediante repositorio
      const space = {
        name: spaceData.name,
        floor: spaceData.floor,
        capacity: spaceData.capacity,
        spaceType: spaceData.spaceType,
        isReservable: spaceData.isReservable,
        reservationCategory: spaceData.reservationCategory,
        assignmentTarget: spaceData.assignmentTarget,
        maxUsagePercentage: spaceData.maxUsagePercentage,
        customSchedule: spaceData.customSchedule
      };

      // Persistencia mediante repositorio
      const savedSpace = await this.spaceRepository.save(space);
      console.log('[DEBUG] Espacio guardado:', savedSpace);
      return savedSpace;

    } catch (error) {

      console.error('[ERROR] Error al crear espacio:', error);
      throw new Error(`Error al crear espacio: ${error.message}`);
    }
  }

  // ===================================
  // CASO DE USO: Obtener espacio por id
  // ===================================
  async handleGetSpaceById(spaceData) {

    // Verifica precondiciones del caso de uso
    if (!spaceData || !spaceData.id) {
      throw new Error('El campo "id" es requerido');
    }

    console.log(`[SpaceService] Buscando espacio con ID: ${spaceData.id}`);

    try {
      // Validación de existencia
      const space = await this.spaceRepository.findById(spaceData.id);

      if (!space) {
        console.warn(`[SpaceService] Espacio no encontrado (ID: ${spaceData.id})`);
        throw new Error('Espacio no encontrado');
      }

      // Se completa la información del edificio si es necesario
      if (space.maxUsagePercentage === null) {
        const buildingInfo = await this.buildingService.handleGetOccupancyPercentage();
        space.maxUsagePercentage = buildingInfo.occupancyPercentage;
      }
      
      if (space.customSchedule === null) {
        const buildingHours = await this.buildingService.handleGetOpeningHours();
        space.customSchedule = buildingHours.openingHours;
      }

      console.log(`[SpaceService] Espacio encontrado: ${space.name}`);
      return space;
    } catch (error) {
      console.error('[ERROR] Error al obtener espacio:', error);
      throw new Error(`Error al obtener espacio: ${error.message}`);
    }
  }

  // =======================================
  // CASO DE USO: Obtener todos los espacios
  // =======================================
  async handleGetAllSpaces(spaceData) {

    try {
      // Consulta al repositorio
      console.log('[SpaceService] Obteniendo todos los espacios');
      const spaces = await this.spaceRepository.findAll(spaceData?.filters || {});
      console.log(`[SpaceService] Espacios encontrados: ${spaces.length}`);

      // Se obtiene la información del edificio para completar valores nulos
      const buildingInfo = await this.buildingService.handleGetBuildingInfo();
      
      // Se completa la información del edificio para cada espacio si es necesario
      for (const space of spaces) {
        if (space.maxUsagePercentage === null) {
          space.maxUsagePercentage = buildingInfo.occupancyPercentage;
        }
        
        if (space.customSchedule === null) {
          space.customSchedule = buildingInfo.openingHours;
        }
      }

      return spaces;
    } catch (error) {
      console.error('[ERROR] Error al obtener espacios:', error);
      throw new Error(`Error al obtener espacios: ${error.message}`);
    }
  }

  // ===============================
  // CASO DE USO: Actualizar espacio
  // ===============================
  async handleUpdateSpace(spaceData) {

    // Verifica precondiciones del caso de uso
    if (!spaceData || !spaceData.id) {
      throw new Error('El campo "id" es requerido');
    }
  
    if (!spaceData.updateFields || Object.keys(spaceData.updateFields).length === 0) {
      throw new Error('Se requieren campos para actualizar');
    }
  
    console.log(`[SpaceService] Iniciando actualización para ID: ${spaceData.id}`);
    console.log('[DEBUG] Campos a actualizar:', spaceData.updateFields);
    
    try {
      // Validación de existencia
      const space = await this.spaceRepository.findById(spaceData.id);
    
      if (!space) {
        console.warn(`[SpaceService] Espacio no encontrado (ID: ${spaceData.id})`);
        throw new Error('Espacio no encontrado');
      }
    
      // Preservación del estado
      const spaceObj = space.toObject ? space.toObject() : space;
      
      const updatedData = {
        ...spaceObj,
        ...spaceData.updateFields
      };
    
      // Se completa la información del edificio para cada espacio si es necesario
      if (updatedData.maxUsagePercentage === null) {
        const buildingInfo = await this.buildingService.handleGetOccupancyPercentage();
        updatedData.maxUsagePercentage = buildingInfo.occupancyPercentage;
      }
      
      if (updatedData.customSchedule === null) {
        const buildingHours = await this.buildingService.handleGetOpeningHours();
        updatedData.customSchedule = buildingHours.openingHours;
      }
      
      // Se valida la asignación de usuarios si se está actualizando y el tipo es 'person'
      if (spaceData.updateFields.assignmentTarget) {
        const assignmentTarget = spaceData.updateFields.assignmentTarget;
        if (assignmentTarget.type === 'person') {
          const isValidAssignment = await this.validateUserAssignment(assignmentTarget);
          if (!isValidAssignment) {
            throw new Error('La asignación de usuarios no es válida. Solo se puede asignar espacios a investigadores contratados o docentes-investigadores.');
          }
        }
      } else if (updatedData.assignmentTarget && updatedData.assignmentTarget.type === 'person') {
        // Si no se está actualizando la asignación pero ya existe una asignación a personas
        const isValidAssignment = await this.validateUserAssignment(updatedData.assignmentTarget);
        if (!isValidAssignment) {
          throw new Error('La asignación de usuarios existente no es válida. Solo se puede asignar espacios a investigadores contratados o docentes-investigadores.');
        }
      }

      // Validación del dominio mediante factoría
      try {
        SpaceFactory.createFromData(updatedData);
      } catch (error) {
        throw new Error(error.message);
      }

      // Persistencia mediante repositorio
      const updatedSpace = await this.spaceRepository.update(updatedData);
    
      console.log(`[SpaceService] Espacio actualizado: ${updatedSpace.name}`);
      console.log('[DEBUG] Datos finales:', {
        id: updatedSpace.id,
        name: updatedSpace.name,
        changes: spaceData.updateFields
      });
    
      return updatedSpace;
    } catch (error) {
      console.error('[ERROR] Error al actualizar espacio:', error);
      throw new Error(`Error al actualizar espacio: ${error.message}`);
    }
  }

  // =============================
  // CASO DE USO: Eliminar espacio
  // =============================
  async handleDeleteSpace(spaceData) {

    // Verifica precondiciones del caso de uso
    if (!spaceData || !spaceData.id) {
      throw new Error('El campo "id" es requerido');
    }

    console.log(`[SpaceService] Iniciando eliminación para ID: ${spaceData.id}`);

    try {
      // Validación de existencia
      const space = await this.spaceRepository.findById(spaceData.id);
      if (!space) {
        console.warn(`[SpaceService] Espacio no encontrado (ID: ${spaceData.id})`);
        throw new Error('Espacio no encontrado');
      }

      // Eliminación mediante el repositorio
      const deletionResult = await this.spaceRepository.delete(spaceData.id);

      console.log(`[SpaceService] Espacio eliminado: ${space.name} (ID: ${spaceData.id})`);

      // Confirmación de eliminación
      return {
        id: spaceData.id,
        name: space.name,
        deletedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[ERROR] Error al eliminar espacio:', error);
      throw new Error(`Error al eliminar espacio: ${error.message}`);
    }
  }

  // =======================================
  // CASO DE USO: Buscar espacios por planta
  // =======================================
  async handleFindSpacesByFloor(searchData) {

    if (!searchData || searchData.floor === undefined) {
      throw new Error('Se requiere especificar una planta');
    }

    console.log(`[SpaceService] Buscando espacios en la planta: ${searchData.floor}`);

    try {
      const spaces = await this.spaceRepository.findByFloor(searchData.floor);
      
      // Se obtiene la información del edificio para completar valores nulos
      const buildingInfo = await this.buildingService.handleGetBuildingInfo();
      
      // Se completa la información del edificio para cada espacio
      for (const space of spaces) {
        if (space.maxUsagePercentage === null) {
          space.maxUsagePercentage = buildingInfo.occupancyPercentage;
        }
        
        if (space.customSchedule === null) {
          space.customSchedule = buildingInfo.openingHours;
        }
      }

      console.log(`[SpaceService] Espacios encontrados en planta ${searchData.floor}: ${spaces.length}`);
      return spaces;
    } catch (error) {
      console.error('[ERROR] Error al buscar espacios por planta:', error);
      throw new Error(`Error al buscar espacios por planta: ${error.message}`);
    }
  }

  // ==========================================
  // CASO DE USO: Buscar espacios por categoría
  // ==========================================
  async handleFindSpacesByCategory(searchData) {

    if (!searchData || !searchData.category) {
      throw new Error('Se requiere especificar una categoría');
    }

    console.log(`[SpaceService] Buscando espacios con categoría: ${searchData.category}`);

    try {
      const spaces = await this.spaceRepository.findByCategory(searchData.category);
      
      // Se obtiene la información del edificio para completar valores nulos
      const buildingInfo = await this.buildingService.handleGetBuildingInfo();
      
      // Se completa la información del edificio para cada espacio
      for (const space of spaces) {
        if (space.maxUsagePercentage === null) {
          space.maxUsagePercentage = buildingInfo.occupancyPercentage;
        }
        
        if (space.customSchedule === null) {
          space.customSchedule = buildingInfo.openingHours;
        }
      }

      console.log(`[SpaceService] Espacios encontrados con categoría ${searchData.category}: ${spaces.length}`);
      return spaces;
    } catch (error) {
      console.error('[ERROR] Error al buscar espacios por categoría:', error);
      throw new Error(`Error al buscar espacios por categoría: ${error.message}`);
    }
  }

  // =============================================
  // CASO DE USO: Buscar espacios por departamento
  // =============================================
  async handleFindSpacesByDepartment(searchData) {

    if (!searchData || !searchData.department) {
      throw new Error('Se requiere especificar un departamento');
    }

    console.log(`[SpaceService] Buscando espacios asignados al departamento: ${searchData.department}`);

    try {
      const spaces = await this.spaceRepository.findByDepartment(searchData.department);
      
      // Se obtiene la información del edificio para completar valores nulos
      const buildingInfo = await this.buildingService.handleGetBuildingInfo();
      
      // Se completa la información del edificio para cada espacio
      for (const space of spaces) {
        if (space.maxUsagePercentage === null) {
          space.maxUsagePercentage = buildingInfo.occupancyPercentage;
        }
        
        if (space.customSchedule === null) {
          space.customSchedule = buildingInfo.openingHours;
        }
      }

      console.log(`[SpaceService] Espacios encontrados para departamento ${searchData.department}: ${spaces.length}`);
      return spaces;
    } catch (error) {
      console.error('[ERROR] Error al buscar espacios por departamento:', error);
      throw new Error(`Error al buscar espacios por departamento: ${error.message}`);
    }
  }
}

module.exports = SpaceService;