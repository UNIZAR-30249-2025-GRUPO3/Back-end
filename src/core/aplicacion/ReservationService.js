// ReservationService.js

const messageBroker = require('../infraestructura/messageBroker');
const BD_ReservationRepository = require('../infraestructura/BD_ReservationRepository');
const UserService = require('./UserService');
const SpaceService = require('./SpaceService');
const ReservationFactory = require('../dominio/Reservation/ReservationFactory');
const moment = require('moment');
const nodemailer = require('nodemailer');
const transporter = require('../infraestructura/mailer');

/**
 * ReservationService.js
 * 
 * SERVICIO DE APLICACIÓN: 
 * - Implementa casos de uso específicos para las reservas
 * - Coordina el flujo de datos entre el dominio y la infraestructura
 */
class ReservationService {
  constructor() {
    this.reservationRepository = new BD_ReservationRepository();
    this.userService = null; 
    this.spaceService = new SpaceService({ initializeConsumer: false });

    this.messageBroker = messageBroker;

    this.setupConsumers().catch(err => {
      console.error('Error al iniciar consumidor de reservas:', err);
    });
  }

    init({ userService }) {
      this.userService = userService;
    }

  // Configura el consumidor de mensajes RabbitMQ
  async setupConsumers() {
    try {
      await this.messageBroker.connect();
      console.log('[RabbitMQ] Consumidor de reservas conectado');

      this.messageBroker.consume('reservation_operations', async (message, correlationId) => {
        if (!message || !message.operation) {
          console.error('[ReservationService] Mensaje malformado:', message);
          return;
        }

        try {
          console.log('[DEBUG] Mensaje recibido en ReservationService:', message);
          let result;
          switch (message.operation) {
            case 'createReservation':
              result = await this.handleCreateReservation(message.data);
              break;
            case 'getAllReservation':
              result = await this.handlegetAllReservation();
              break;
            case 'getReservationById':
              result = await this.handleGetReservationById(message.data);
              break;
            case 'deleteReservation':
              result = await this.handleDeleteReservation(message.data);
              break;
            case 'validateReservation':
              result = await this.handleValidateReservation(message.data);
              break;
            case 'invalidReservation':
              result = await this.handleInvalidReservation(message.data);
              break;
            case 'getReservationsByUser':
              result = await this.handleGetReservationsByUser(message.data);
              break;
            case 'getAliveReservations':
              result = await this.handleGetAliveReservations();
              break;
            default:
              throw new Error(`Operación no soportada: ${message.operation}`);
          }

          await this.messageBroker.sendResponse(result, correlationId, message.replyTo);
        } catch (error) {
          console.error('Error procesando mensaje de reservas:', error);
          const errorResponse = { success: false, error: error.message };
          await this.messageBroker.sendResponse(errorResponse, correlationId, message.replyTo);
        }
      });
    } catch (error) {
      console.error('Error en setupConsumers de ReservationService:', error);
    }
  }


  // Función para validar las reglas de la reserva
  async validateUserCanReserveSpace(userId, spaceId, startTime, duration) {
      
    // Obtener información del usuario
    const user = await this.userService.handleGetUserById({ id: userId });
    if (!user) throw new Error('Usuario no encontrado');

    // Obtener información del espacio
    const space = await this.spaceService.handleGetSpaceById({ id: spaceId});
    if (!space) throw new Error('Espacio no encontrado');
    if (!space.isReservable) throw new Error('El espacio no es reservable');


    const roles = user.role?.roles?.map(r => r.toLowerCase()) || [];

    const isGerente = roles.includes("gerente");

    // Verificación de rol y categoría de la reserva
    if (roles.includes("estudiante")) { 
        if (space.reservationCategory.name !== "sala común") {
            throw new Error('Los estudiantes solo pueden reservar salas comunes');
        }
    } else if (roles.includes("técnico de laboratorio")) {
        if (space.reservationCategory.name ===  "aula") {
            throw new Error('Los técnicos de laboratorio no pueden reservar aulas');
        }else if (space.reservationCategory.name === "laboratorio" || space.reservationCategory.name === "seminario"){
          if (space.assignmentTarget.type !== "department" || 
            !space.assignmentTarget.targets.includes(user.department.name)) {
            throw new Error('El rol no puede reservar este tipo de espacio o no pertenece a su departamento');
        }
        }
    } else if (roles.includes("investigador contratado") || (roles.includes("docente-investigador") && !roles.includes("gerente"))) { 
      if (space.reservationCategory.name === "laboratorio") {
          if (space.assignmentTarget.type !== "department" || 
              !space.assignmentTarget.targets.includes(user.department.name)) {
              throw new Error('El rol no puede reservar este tipo de espacio o no pertenece a su departamento');
          }
      }
  }

    // Verificar que la categoría de reserva no sea despacho
    if (space.reservationCategory.name === "despacho" && space.category === 'despacho') {
        throw new Error('La categoría de despacho no puede ser reservable');
    }

    // Validación de horario
    const start = moment(startTime);
    const end = moment(startTime).add(duration, 'minutes');

    //Verificar que no cruce al día siguiente
    if (!start.isSame(end, 'day')) {
      throw new Error('La reserva debe comenzar y terminar el mismo día');
    }

    const dayOfWeek = start.format('dddd').toLowerCase();
    const dayTranslations = {monday: 'lunes', tuesday: 'martes', wednesday: 'miércoles', thursday: 'jueves', friday: 'viernes', saturday: 'sábado', sunday: 'domingo'};
    let schedule;


    if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(dayOfWeek)) {
      schedule = space.customSchedule?.['weekdays'];
    } else if (['saturday', 'sunday'].includes(dayOfWeek)) {
      schedule = space.customSchedule?.[dayOfWeek];
    }

    // Validar si hay horario disponible
    if (!schedule || !schedule.open || !schedule.close) {
      const dayInSpanish = dayTranslations[dayOfWeek] || dayOfWeek;
      throw new Error(`El espacio no está disponible para reservas el día seleccionado: ${dayInSpanish}`);
    }


    const openTime = moment(start.format('YYYY-MM-DD') + 'T' + schedule.open);
    const closeTime = moment(start.format('YYYY-MM-DD') + 'T' + schedule.close);

    //Verificar no difiera horario de apertura y cierre
    if (start.isBefore(openTime) || end.isAfter(closeTime)) {
      const dayInSpanish = dayTranslations[dayOfWeek] || dayOfWeek;
      throw new Error(`La reserva debe estar entre ${schedule.open} y ${schedule.close} del ${dayInSpanish}`);
    }


    // Verificar disponibilidad del espacio
    const overlappingReservations = await this.reservationRepository.findOverlappingReservations(spaceId, startTime, duration);
    if (overlappingReservations.length > 0) {
        throw new Error('El espacio ya está reservado en el periodo de tiempo solicitado');
    }

    // Si todas las validaciones pasan, podemos continuar
    return true;
  }


  // ================================
  // CASO DE USO: Crear una reserva
  // ================================
  async handleCreateReservation(Reservationdata) {

    try{
        for (const spaceId of Reservationdata.spaceIds) {
          await this.validateUserCanReserveSpace(
            Reservationdata.userId,
            spaceId,
            Reservationdata.startTime,
            Reservationdata.duration
          );
        }

        // Verificación de ocupación máxima
        let totalCapacityAllowed = 0;
        for (const spaceId of Reservationdata.spaceIds) {
          const space = await this.spaceService.handleGetSpaceById({ id: spaceId});
          const capacityAllowed = space.capacity * (space.maxUsagePercentage / 100);
          totalCapacityAllowed += capacityAllowed;
        }

        if (Reservationdata.maxAttendees > totalCapacityAllowed) {
          throw new Error(`El número de asistentes (${Reservationdata.maxAttendees}) excede la capacidad total permitida (${totalCapacityAllowed}) de los espacios seleccionados.`);
        }
        

        // Validación de dominio y creación del objeto
        const reservation = ReservationFactory.createStandardReservation(
          1,
          Reservationdata.userId,
          Reservationdata.spaceIds,
          Reservationdata.usageType,
          Reservationdata.maxAttendees,
          Reservationdata.startTime,
          Reservationdata.duration,
          Reservationdata.additionalDetails
        );
      
        const savedReservation = await this.reservationRepository.save(reservation);
        console.log('[DEBUG] Reserva guardada:', savedReservation);
        return savedReservation;
    }
    catch (error) {
        console.error('[ERROR] Error al crear reserva:', error);
        throw new Error(`Error al crear reserva: ${error.message}`);
    }
  }


  // =====================================
  // CASO DE USO: Obtener todas las reservas
  // =====================================
  async handlegetAllReservation(Reservationdata) {

    const reservation = await this.reservationRepository.findAll();
    if (!reservation) throw new Error('Reserva no encontrada');

    return reservation;
  }

  // =====================================
  // CASO DE USO: Obtener reserva por ID
  // =====================================
  async handleGetReservationById(Reservationdata) {
    if (!Reservationdata?.id) throw new Error('El campo "id" es requerido');

    const reservation = await this.reservationRepository.findById(Reservationdata.id);
    if (!reservation) throw new Error('Reserva no encontrada');

    return reservation;
  }

  // ===================================
  // CASO DE USO: Eliminar una reserva
  // ===================================
  async handleDeleteReservation(Reservationdata) {
    if (!Reservationdata?.id) throw new Error('El campo "id" es requerido');
    
    const reservation = await this.reservationRepository.findById(Reservationdata.id);
    if (!reservation) throw new Error('Reserva no encontrada');
    const userID = reservation.userId
    const user = await this.userService.handleGetUserById({ id: userID });

    if (user.email) {
        await transporter.sendMail({
              from: '"Reservas Unizar" <noreply@reservasunizar.com>',
              to: user.email,
              subject: "Reserva eliminada",
              text: `Tu reserva con ID ${Reservationdata.id} de la fecha ${reservation.startTime} ha sido cancelada correctamente.`,
        });
    }

    const updated = await this.reservationRepository.delete(reservation.id);
    
    return {
      id: Reservationdata.id,
      deletedAt: new Date().toISOString()
    };
  }


  // =====================================================
  // CASO DE USO: Validar o actualizar una reserva inválida
  // =====================================================
  async handleValidateReservation(Reservationdata) {
    try {
      if (!Reservationdata?.id) throw new Error('El campo "id" es requerido');

      const existingReservation = await this.reservationRepository.findById(Reservationdata.id);
      if (!existingReservation) {
        throw new Error('Reserva no encontrada');
      }

      const reservationObj = existingReservation.toObject ? existingReservation.toObject() : existingReservation;
    
      const updatedReservation = {
        ...reservationObj,
        status: 'valid'  
      };
      
      const updated = await this.reservationRepository.update(updatedReservation);
      return updated;
    } catch (error) {
      console.error('[ERROR] Error al validar reserva:', error);
      throw new Error(`Error al validar reserva: ${error.message}`);
    }
  }
  

  // ===================================
  // CASO DE USO: Invalidar una reserva
  // ===================================
  async handleInvalidReservation(Reservationdata) {
    if (!Reservationdata?.id) throw new Error('El campo "id" es requerido');

    const existingReservation = await this.reservationRepository.findById(Reservationdata.id);
    if (!existingReservation) {
      throw new Error('Reserva no encontrada');
    }

    const reservationObj = existingReservation.toObject ? existingReservation.toObject() : existingReservation;
  
    const updatedReservation = {
      ...reservationObj,
      status: 'potentially_invalid',
      invalidatedat: new Date()
    };
    
    const updated = await this.reservationRepository.update(updatedReservation);
    return updated;
  }

  // ===============================================
  // CASO DE USO: Obtener reservas de un usuario
  // ===============================================
  async handleGetReservationsByUser(Reservationdata) {
    if (!Reservationdata?.userId) throw new Error('El campo "userId" es requerido');

    const reservations = await this.reservationRepository.findByUserId(Reservationdata.userId);
    return reservations;
  }

  // ===============================================
  // CASO DE USO: Obtener reservas vivas
  // ===============================================
  async handleGetAliveReservations() {
    try {
        const aliveReservations = await this.reservationRepository.findAliveReservation();
        return aliveReservations;
    } catch (error) {
        console.error('[ERROR] Error al obtener reservas vivas:', error);
        throw new Error(`Error al obtener reservas vivas: ${error.message}`);
    }
  }

}

module.exports = ReservationService;
