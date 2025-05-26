const messageBroker = require('../infraestructura/messageBroker');
const BD_SpaceRepository = require('../infraestructura/BD_SpaceRepository');
const BuildingService = require('./BuildingService');
const UserService = require('./UserService');
const SpaceFactory = require('../dominio/Space/SpaceFactory');
const ReservationService = require('./ReservationService');

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
    this.userService = null; 
    this.reservationService = null;

    this.messageBroker = messageBroker; // Guarda la instancia
    
    // Lista de campos permitidos para actualización
    this.allowedUpdateFields = [
      'reservationCategory',
      'assignmentTarget',
      'maxUsagePercentage', 
      'customSchedule',
      'isReservable'
    ];
    
    // Inicialización de consumidores de mensajes
    this.setupConsumers().catch(err => {
      console.error('Error al iniciar consumidor:', err);
    });
  }

  init({ userService, reservationService }) {
      this.userService = userService;
      this.reservationService = reservationService;
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
            case 'findSpacesByMinOccupants':
              result = await this.handleFindSpacesByMinOccupants(message.data);
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

  //Método para validar que los usuarios asignados al espacio tengan roles permitidos
  async validateUserAssignment(assignmentTarget) {

    // Solo se valida si el tipo de asignación es a personas
    if (assignmentTarget.type !== 'person') {
      return true;
    }

    const targets = assignmentTarget.targets || [];

    // Lista de roles permitidos
    const allowedRoles = ['investigador contratado', 'docente-investigador'];

    for (const userId of targets) {
      try {
        // Obtener información del usuario directamente del servicio
        const user = await this.userService.handleGetUserById({ id: userId });
        
        if (!user || !user.role) {
          console.warn(`[SpaceService] Usuario no encontrado o sin rol (ID: ${userId})`);
          return false;
        }
        
        // Se verifica que el usuario tenga uno de los roles permitidos para asignación de espacios
        let userRoles = [];

        if (typeof user.role === 'string') {
          userRoles = [user.role];
        } else if (Array.isArray(user.role)) {
          userRoles = user.role;
        } else if (user.role.roles && Array.isArray(user.role.roles)) {
          userRoles = user.role.roles;
        }

        // Verificamos si al menos uno de los roles está permitido
        const hasAllowedRole = userRoles.some(role => allowedRoles.includes(role));

        if (!hasAllowedRole) {
          console.warn(`[SpaceService] Ningún rol permitido para el usuario ${userId}. Roles: ${userRoles.join(', ')}`);
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
            spaceData.customSchedule,
            spaceData.spaceType,
            spaceData.idSpace
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
        customSchedule: spaceData.customSchedule,
        idSpace: spaceData.idSpace
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
    
    // Valida que no se estén intentando actualizar campos no permitidos
    const attemptedFields = Object.keys(spaceData.updateFields);
    const invalidFields = attemptedFields.filter(field => !this.allowedUpdateFields.includes(field));
    
    if (invalidFields.length > 0) {
      throw new Error(`No se permite actualizar los siguientes campos: ${invalidFields.join(', ')}. Los campos permitidos son: ${this.allowedUpdateFields.join(', ')}`);
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
      
      const normalizedUpdateFields = {
        ...spaceData.updateFields,
        spaceType: spaceData.updateFields.spaceType?.name || spaceObj.spaceType?.name || spaceObj.spaceType,
        reservationCategory: spaceData.updateFields.reservationCategory?.name || spaceData.updateFields.reservationCategory || spaceObj.reservationCategory?.name
        || spaceObj.reservationCategory,
      };

      const updatedData = {
        ...spaceObj,
        ...normalizedUpdateFields // Esto sobrescribe solo los campos permitidos
      };
    
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

      // Crear una copia temporal con valores de edificio para validación
      const tempDataForValidation = {...updatedData};
      
      // Completar temporalmente los valores null con los del edificio para validación
      if (tempDataForValidation.maxUsagePercentage === null) {
        const buildingInfo = await this.buildingService.handleGetOccupancyPercentage();
        tempDataForValidation.maxUsagePercentage = buildingInfo.occupancyPercentage;
      }
      
      if (tempDataForValidation.customSchedule === null) {
        const buildingHours = await this.buildingService.handleGetOpeningHours();
        tempDataForValidation.customSchedule = buildingHours.openingHours;
      }

      // Validación del dominio mediante factoría
      try {
        console.log('[DEBUG] Validando con temporales:', tempDataForValidation);
        SpaceFactory.createFromData(tempDataForValidation);
      } catch (error) {
        throw new Error(error.message);
      }

      // Persistencia mediante repositorio
      console.log('[DEBUG] Guardando en BD (manteniendo null):', updatedData);
      const updatedSpace = await this.spaceRepository.update(updatedData);
    
      console.log(`[SpaceService] Espacio actualizado: ${updatedSpace.name}`);
      console.log('[DEBUG] Datos finales:', {
        id: updatedSpace.id,
        name: updatedSpace.name,
        changes: spaceData.updateFields
      });
    

      const reservations = await this.reservationService.handlegetAllReservation();
      const affectedReservations = reservations.filter(r => r.spaceIds.includes(updatedSpace.id));
      for (const reservation of affectedReservations) {
        const { id: reservationId, userId, spaceIds, startTime, duration, maxAttendees } = reservation;

        try {
          await this.reservationService.validateUserCanReserveSpace(userId, updatedSpace.id, startTime, duration);
          let totalCapacityAllowed = 0;
          for (const spaceId of spaceIds) {
            const space = await this.spaceService.handleGetSpaceById({ id: spaceId});
            const capacityAllowed = space.capacity * (space.maxUsagePercentage / 100);
            totalCapacityAllowed += capacityAllowed;
          }
          if (maxAttendees > totalCapacityAllowed) {
            throw new Error(`El número de asistentes (${maxAttendees}) excede la capacidad total permitida (${totalCapacityAllowed}) de los espacios seleccionados.`);
          }
        } catch (err) {
          console.warn(`[SpaceService] Reserva ${reservationId} inválida tras actualizar espacio ${updatedSpace.id}: ${err.message}`);
          
          await this.reservationService.handleInvalidReservation({ id: reservationId });
        }
      }

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

  // ==============================================
  // CASO DE USO: Buscar espacios por ocupantes mínimos
  // ==============================================
  async handleFindSpacesByMinOccupants(searchData) {

    if (!searchData || searchData.minOccupants === undefined) {
      throw new Error('Se requiere especificar un número mínimo de ocupantes');
    }

    // Aseguramos que sea un número
    const minOccupants = parseInt(searchData.minOccupants, 10);
    if (isNaN(minOccupants) || minOccupants <= 0) {
      throw new Error('El número mínimo de ocupantes debe ser un número positivo');
    }

    console.log(`[SpaceService] Buscando espacios con capacidad para al menos: ${minOccupants} ocupantes`);

    try {
      let spaces = await this.spaceRepository.findByMinCapacity(minOccupants);
      
      // Se obtiene la información del edificio para completar valores nulos
      const buildingInfo = await this.buildingService.handleGetBuildingInfo();
      
      // Se completa la información del edificio para cada espacio
      spaces = spaces.filter(space => {

        if (space.maxUsagePercentage !== null) {
          return true;
        }
        
        const buildingPercentage = buildingInfo.occupancyPercentage || 100;
        const adjustedCapacity = Math.floor((space.capacity * buildingPercentage) / 100);
        return adjustedCapacity >= minOccupants;
      });
      
      for (const space of spaces) {
        if (space.maxUsagePercentage === null) {
          space.maxUsagePercentage = buildingInfo.occupancyPercentage;
        }
        
        if (space.customSchedule === null) {
          space.customSchedule = buildingInfo.openingHours;
        }
      }

      console.log(`[SpaceService] Espacios encontrados con capacidad para al menos ${minOccupants} ocupantes: ${spaces.length}`);
      return spaces;
    } catch (error) {
      console.error('[ERROR] Error al buscar espacios por ocupantes mínimos:', error);
      throw new Error(`Error al buscar espacios por ocupantes mínimos: ${error.message}`);
    }
  }
}

module.exports = SpaceService;