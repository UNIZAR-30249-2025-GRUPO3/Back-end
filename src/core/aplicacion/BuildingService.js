const messageBroker = require('../infraestructura/messageBroker');
const BD_BuildingRepository = require('../infraestructura/BD_BuildingRepository');

/**
 * BuildingService.js
 * 
 * SERVICIO DE APLICACIÓN: 
 * - Implementa casos de uso específicos para el edificio
 * - Coordina el flujo de datos con el dominio y la infraestructura
 */
class BuildingService {

  constructor({ initializeConsumer = true } = {}) {
    // Dependencias de infraestructura
    this.messageBroker = messageBroker;
    this.buildingRepository = new BD_BuildingRepository();
    this.buildingId = 'ada-byron'; // ID del único edificio del sistema

    this.queueName = 'building_operations';
  
    if (initializeConsumer) {
      // Inicialización de consumidores de mensajes
      this.setupConsumers().catch(err => {
        console.error('Error al iniciar consumidor:', err);
      });
    }
  }

  // SERVICIO DISTRIBUIDO: Configuración para comunicación asíncrona
  async setupConsumers() {
    try {
      await this.messageBroker.connect();
      console.log('[RabbitMQ] Consumidor de edificio conectado');

      // Verificar que la cola existe
      await this.messageBroker.channel.assertQueue(this.queueName, { durable: true });
      
      this.messageBroker.consume(this.queueName, async (message, correlationId) => {
        if (!message || !message.operation) {
          console.error('[BuildingService] Mensaje malformado:', message);
          return;
        }
        try {
          console.log('[DEBUG] Mensaje recibido:', message);
          let result;
          switch (message.operation) {
            case 'getBuildingInfo':
              result = await this.handleGetBuildingInfo();
              break;
            case 'getOccupancyPercentage':
              result = await this.handleGetOccupancyPercentage();
              break;
            case 'getOpeningHours':
              result = await this.handleGetOpeningHours();
              break;
            case 'updateOccupancyPercentage':
              result = await this.handleUpdateOccupancyPercentage(message.data);
              break;
            case 'updateOpeningHours':
              result = await this.handleUpdateOpeningHours(message.data);
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

  // ================================================
  // Métodos de servicio que implementan casos de uso
  // ================================================

  // ===================================
  // CASO DE USO: Obtener información del edificio
  // ===================================
  async handleGetBuildingInfo() {
    console.log('[BuildingService] Obteniendo información del edificio');
    
    try {
      const building = await this.buildingRepository.findById(this.buildingId);
      if (!building) {
        throw new Error('Edificio no encontrado');
      }
      
      return {
        id: building.id,
        name: building.name,
        floors: building.floors,
        occupancyPercentage: building.maxOccupancyPercentage,
        openingHours: building.openingHours
      };
    } catch (error) {
      console.error('[BuildingService] Error obteniendo información del edificio:', error);
      throw error;
    }
  }

  // ===================================
  // CASO DE USO: Obtener porcentaje de ocupación
  // ===================================
  async handleGetOccupancyPercentage() {
    console.log('[BuildingService] Obteniendo porcentaje de ocupación');
    
    try {
      const building = await this.buildingRepository.findById(this.buildingId);
      if (!building) {
        throw new Error('Edificio no encontrado');
      }
      
      return {
        occupancyPercentage: building.maxOccupancyPercentage
      };
    } catch (error) {
      console.error('[BuildingService] Error obteniendo porcentaje de ocupación:', error);
      throw error;
    }
  }

  // ===================================
  // CASO DE USO: Obtener horarios
  // ===================================
  async handleGetOpeningHours() {
    console.log('[BuildingService] Obteniendo horarios de apertura');
    
    try {
      const building = await this.buildingRepository.findById(this.buildingId);
      if (!building) {
        throw new Error('Edificio no encontrado');
      }
      
      return {
        openingHours: building.openingHours
      };
    } catch (error) {
      console.error('[BuildingService] Error obteniendo horarios:', error);
      throw error;
    }
  }

  // ===================================
  // CASO DE USO: Actualizar porcentaje de ocupación
  // ===================================
  async handleUpdateOccupancyPercentage(data) {
    if (!data || typeof data.percentage !== 'number') {
      throw new Error('Se requiere un porcentaje válido');
    }

    console.log(`[BuildingService] Actualizando porcentaje de ocupación a: ${data.percentage}%`);
    
    try {
      const updatedBuilding = await this.buildingRepository.updateOccupancyPercentage(
        this.buildingId, 
        data.percentage
      );
      
      return {
        success: true,
        occupancyPercentage: updatedBuilding.maxOccupancyPercentage
      };
    } catch (error) {
      console.error('[BuildingService] Error actualizando porcentaje de ocupación:', error);
      throw error;
    }
  }

  // ===================================
  // CASO DE USO: Actualizar horarios
  // ===================================
  async handleUpdateOpeningHours(data) {
    if (!data || !data.day || !data.hours) {
      throw new Error('Se requieren datos válidos para actualizar horarios');
    }

    const validDays = ['weekdays', 'saturday', 'sunday'];
    if (!validDays.includes(data.day)) {
      throw new Error('Día no válido. Debe ser weekdays, saturday o sunday');
    }

    console.log(`[BuildingService] Actualizando horarios para: ${data.day}`);
    
    try {
      // Obtener el edificio actual
      const building = await this.buildingRepository.findById(this.buildingId);
      if (!building) {
        throw new Error('Edificio no encontrado');
      }

      // Validar formato de horas (HH:MM o null)
      const validateTimeFormat = (time) => {
        if (time === null) return true;
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return timeRegex.test(time);
      };

      if (
        (data.hours.open !== undefined && !validateTimeFormat(data.hours.open)) ||
        (data.hours.close !== undefined && !validateTimeFormat(data.hours.close))
      ) {
        throw new Error('Formato de hora inválido. Debe ser HH:MM o null');
      }

      // Preparar los nuevos horarios manteniendo los existentes
      const newOpeningHours = { ...building.openingHours };
      const currentHours = newOpeningHours[data.day];
      
      newOpeningHours[data.day] = {
        open: data.hours.open !== undefined ? data.hours.open : currentHours.open,
        close: data.hours.close !== undefined ? data.hours.close : currentHours.close
      };

      // Actualizar en la base de datos
      const updatedBuilding = await this.buildingRepository.updateOpeningHours(
        this.buildingId, 
        newOpeningHours
      );
      
      return {
        success: true,
        openingHours: updatedBuilding.openingHours
      };
    } catch (error) {
      console.error('[BuildingService] Error actualizando horarios:', error);
      throw error;
    }
  }
}

module.exports = BuildingService;