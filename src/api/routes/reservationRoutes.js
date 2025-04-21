const express = require('express');
const { isAuthenticated } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Endpoints para la gestión de reservas de espacios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReservationCategory:
 *       type: string
 *       description: Categoría de reserva del espacio
 *       enum: [aula, seminario, laboratorio, "sala común"]
 *     Reservation:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - spaceIds
 *         - usageType
 *         - maxAttendees
 *         - startTime
 *         - duration
 *         - category
 *       properties:
 *         id:
 *           type: string
 *           description: ID autogenerado de la reserva
 *         userId:
 *           type: string
 *           description: ID del usuario que realiza la reserva
 *         spaceIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: Lista de IDs de los espacios reservados
 *         usageType:
 *           type: string
 *           enum: [docencia, investigacion, gestion, otro]
 *           description: Tipo de uso de la reserva
 *         maxAttendees:
 *           type: integer
 *           description: Número máximo de asistentes
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de inicio de la reserva
 *         duration:
 *           type: integer
 *           description: Duración de la reserva en minutos
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de fin de la reserva
 *         additionalDetails:
 *           type: string
 *           description: Detalles adicionales sobre la reserva
 *         category:
 *           $ref: '#/components/schemas/ReservationCategory'
 *         status:
 *           type: string
 *           description: Estado actual de la reserva (por defecto 'valid')
 */

function setupReservationRoutes(reservationController) {
  const router = express.Router();

  /**
   * @swagger
   * /api/reservations:
   *   post:
   *     summary: Crear una nueva reserva
   *     description: Crea una reserva de un espacio para un rango de tiempo.
   *     tags: [Reservations]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Reservation'
   *           example:
   *             userId: 2
   *             spaceIds: [1]
   *             usageType: "docencia"
   *             maxAttendees: 20
   *             startTime: "2025-04-21T10:00:00Z"
   *             duration: 60
   *             category: "aula"
   * 
   *     responses:
   *       201:
   *         description: Reserva creada exitosamente
   *       400:
   *         description: Datos inválidos o espacio no disponible
   *       401:
   *         description: No autenticado
   */
  router.post('/', isAuthenticated, (req, res) => reservationController.createReservation(req, res));

  /**
   * @swagger
   * /api/reservations:
   *   get:
   *     summary: Obtener todas las reservas 
   *     tags: [Reservations]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de reservas obtenida exitosamente
   *       401:
   *         description: No autenticado
   */
  router.get('/', isAuthenticated, (req, res) => reservationController.getAllReservation(req, res));

  /**
   * @swagger
   * /api/reservations/{id}:
   *   get:
   *     summary: Obtener reserva por id
   *     tags: [Reservations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la reserva a cancelar
   *     responses:
   *       200:
   *         description: Reserva obtenida correctamente
   *       401:
   *         description: No autenticado
   *       403:
   *         description: No autorizado para cancelar esta reserva
   *       404:
   *         description: Reserva no encontrada
   */
    router.get('/:id', isAuthenticated, (req, res) => reservationController.getReservationById(req, res));

  /**
   * @swagger
   * /api/reservations/{id}:
   *   delete:
   *     summary: Elimina una reserva
   *     description: Elimina una reserva existente según su identificador
   *     tags: [Reservations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la reserva a elimnar
   *     responses:
   *       200:
   *         description: Reserva elimnada exitosamente
   *       401:
   *         description: No autenticado
   *       403:
   *         description: No autorizado para eliminar esta reserva
   *       404:
   *         description: Reserva no encontrada
   */
  router.delete('/:id', isAuthenticated, (req, res) => reservationController.deleteReservation(req, res));

  return router;
}

module.exports = setupReservationRoutes;
